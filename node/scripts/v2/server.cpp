#include <unistd.h>
#include <sys/wait.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <pwd.h>
#include <grp.h>
#include <fcntl.h>
#include <fstream>
#include <iostream>
#include <map>
#include <string>
#include <thread>
#include <vector>
#include <sstream>

void kill_process(pid_t pid)
{
    // Kill the process
    kill(pid, SIGTERM);

    // Wait for the process to exit
    int status;
    waitpid(pid, &status, 0);
}

void handle_connection(int connection_fd, int stdin_pipe) {
    // Continuously read from the socket and write to the stdin pipe
    char buffer[1024];
    while (true)
    {
        ssize_t bytes_read = read(connection_fd, buffer, sizeof(buffer));
        if (bytes_read < 0)
        {
            perror("read");
            break;
        }
        else if (bytes_read == 0)
        {
            break;
        }

        ssize_t bytes_written = write(stdin_pipe, buffer, bytes_read);
        if (bytes_written < 0)
        {
            perror("write");
            break;
        }
    }
}

int main(int argc, char *argv[])
{
    if (argc < 2)
    {
        std::cerr << "Usage: " << argv[0] << " CONFIG_FILE" << std::endl;
        return 1;
    }

    // Parse the configuration file and store the options in a map
    std::map<std::string, std::string> options;
    std::ifstream config_file(argv[1]);
    std::string line;
    while (std::getline(config_file, line))
    {
        size_t pos = line.find('=');
        if (pos != std::string::npos)
        {
            std::string key = line.substr(0, pos);
            std::string value = line.substr(pos + 1);
            options[key] = value;
        }
    }

    // Get the path of the process to start, its arguments, the output file path, and the socket path from the map
    std::string process_path = options["EXECUTABLE"];
    std::string process_args = options["ARGS"];
    std::string output_path = options["OUTPUT"];
    std::string socket_path = options["SOCKET"];
    std::string working_dir = options["WORKING_DIR"];

    // Check if root
    if (geteuid() != 0)
    {
        std::cerr << "Must be run as root" << std::endl;
        return 1;
    }

    // Try to drop to the specified effective UID and GID
    int uid = -1;
    int gid = -1;
    if (options.count("UID"))
    {
        struct passwd *pwd = getpwnam(options["UID"].c_str());
        if (pwd)
        {
            uid = pwd->pw_uid;
            gid = pwd->pw_gid;
        }
    }
    if (options.count("GID"))
    {
        struct group *grp = getgrnam(options["GID"].c_str());
        if (grp)
        {
            gid = grp->gr_gid;
        }
    }

    // Print out all of the config options
    std::cout << "Process path: " << process_path << std::endl;
    std::cout << "Process args: " << process_args << std::endl;
    std::cout << "Output path: " << output_path << std::endl;
    std::cout << "Socket path: " << socket_path << std::endl;
    std::cout << "UID: " << uid << std::endl;
    std::cout << "GID: " << gid << std::endl;

    if (uid == -1 || gid == -1 || setgid(gid) < 0 || setuid(uid) < 0)
    {
        std::cerr << "Failed to set effective UID/GID" << std::endl;
        return 1;
    }

    // Print out the UID and GID of the process
    std::cout << "Successfully dropped to UID " << getuid() << " and GID " << getgid() << std::endl;

    // Start the process
    int stdin_pipefd[2];
    if (pipe(stdin_pipefd) < 0)
    {
        perror("pipe");
        return 1;
    }

    pid_t pid = fork();
    if (pid < 0)
    {
        perror("fork");
        return 1;
    }
    else if (pid == 0)
    {
        // Child process

        // Redirect stdin to the pipe
        dup2(stdin_pipefd[0], STDIN_FILENO);
        
        // Open the output file
        int output_fd = open(output_path.c_str(), O_WRONLY | O_CREAT | O_TRUNC, 0644);
        if (output_fd < 0)
        {
            perror("open");
            exit(1);
        }

        // Redirect stdout to the output file
        dup2(output_fd, STDOUT_FILENO);

        // Redirect stderr to the output file
        dup2(output_fd, STDERR_FILENO);

        // Close the output file
        close(output_fd);

        // Change the working directory 
        if (chdir(working_dir.c_str()) < 0)
        {
            perror("chdir");
            exit(1);
        }

        // Split process_args into a char* array
        std::vector<char*> args;
        char* token = strtok(const_cast<char*>(process_args.c_str()), " ");
        while (token != NULL)
        {
            args.push_back(token);
            token = strtok(NULL, " ");
        }
        args.push_back(NULL);

        // Start the process
        if (execve(process_path.c_str(), args.data(), environ) < 0)
        {
            perror("execve");
            exit(1);
        }
    }
    else
    {
        // Parent process
        std::cout << "Started process with PID " << pid << std::endl;

        // Start listener
        pid_t listener_pid = fork();

        if (listener_pid < 0)
        {
            perror("fork");
            kill_process(pid);
            return 1;
        } else {
            if (listener_pid == 0) {
                // Child process

                // Open the socket
                int socket_fd = socket(AF_UNIX, SOCK_STREAM, 0);
                if (socket_fd < 0)
                {
                    perror("socket");
                    exit(1);
                }

                // Bind the socket
                struct sockaddr_un addr;
                memset(&addr, 0, sizeof(struct sockaddr_un));
                addr.sun_family = AF_UNIX;

                // Unlink socket_path if it already exists
                if (access(socket_path.c_str(), F_OK) == 0)
                {
                    if (unlink(socket_path.c_str()) < 0)
                    {
                        perror("unlink");
                        exit(1);
                    }
                }

                strncpy(addr.sun_path, socket_path.c_str(), sizeof(addr.sun_path) - 1);
                if (bind(socket_fd, (struct sockaddr *) &addr, sizeof(struct sockaddr_un)) < 0)
                {
                    perror("bind");
                    exit(1);
                }

                // Listen on the socket
                if (listen(socket_fd, 1) < 0)
                {
                    perror("listen");
                    exit(1);
                }

                // Continually accept connections and handle them
                while (true)
                {
                    // Accept a connection
                    int connection_fd = accept(socket_fd, NULL, NULL);
                    if (connection_fd < 0)
                    {
                        perror("accept");
                        exit(1);
                    }

                    // Handle the connection
                    handle_connection(connection_fd, stdin_pipefd[1]);
                }

                // Close the read end of the stdin pipe
                close(stdin_pipefd[0]);

                // Wait for the process to exit
                int status;
                waitpid(pid, &status, 0);

                // Exit
                exit(0);
            } else {
                // Parent process

                std::cout << "Started listener with PID " << listener_pid << std::endl;

                // Close the read end of the stdin pipe
                close(stdin_pipefd[0]);

                // Wait for the launched process to exit
                int status;
                waitpid(pid, &status, 0);

                std::cout << "Process exited with status " << status << std::endl;

                // Kill the listener
                kill_process(listener_pid);

                std::cout << "Killed listener with PID " << listener_pid << std::endl;

                // Delete the socket
                unlink(socket_path.c_str());

                // Exit
                std::cout << "Exiting" << std::endl;
                return 0;
            }
        }
    }
}
