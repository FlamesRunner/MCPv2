#include "server.h"
#define CONSOLE_BUF_SIZE 1024
#define MAX_CONNECTIONS 100
#define CMD_PATH "mcp_in.sock"
#define LOG_PATH "./server/server_console.log"
#define DEBUG_LOG_PATH "./server/server_debug.log"
#define JAVA_PATH "/usr/bin/java"
#define JAVA_ARGS "-jar server.jar nogui"

// define server constructor
Server::Server(int min_mem, int max_mem, std::vector <char *> additional_args)
{
    this->max_mem = max_mem;
    this->min_mem = min_mem;
    this->additional_args = additional_args;
}

void Server::redir_std()
{
    // redirect stdout to log file
    freopen(LOG_PATH, "a", stdout);
    // redirect stderr to debug log file
    freopen(DEBUG_LOG_PATH, "a", stderr);
}

void Server::stop() {
    // stop server
    std::cout << "Stopping server..." << std::endl;
    for (auto &t : client_threads) {
        if (t.joinable()) {
            t.join();
        }
    }
}

void handle_connection(int client_socket, int stdin_fd)
{
    FILE *console_file = fopen(LOG_PATH, "a");

    // Read from client socket
    char buffer[CONSOLE_BUF_SIZE];
    std::string console_prefix = "> ";

    while (recv(client_socket, buffer, CONSOLE_BUF_SIZE, 0) > 0)
    {
        // Write to console
        fprintf(console_file, "%s%s\n", console_prefix.c_str(), buffer);
        // Write to stdin
        write(stdin_fd, buffer, strlen(buffer));
    }

    // Close client socket
    close(client_socket);

    // Close console file
    fclose(console_file);
}

void socket_listen(int stdin_fd)
{
    // Listen on socket and pipe input to stdin_fd
    // Open debug log file
    int socket_fd = socket(PF_UNIX, SOCK_STREAM, 0);
    if (socket_fd < 0)
    {
        // print error message
        std::cout << "Error opening socket\n" << std::endl;
        // exit program
        exit(1);
    }

    // set socket address
    struct sockaddr_un socket_address;
    socket_address.sun_family = AF_UNIX;
    strcpy(socket_address.sun_path, CMD_PATH);
    unlink(CMD_PATH);
    // bind socket to address
    if (bind(socket_fd, (struct sockaddr *)&socket_address, sizeof(socket_address)) < 0)
    {
        // print error message
        std::cout << "Error binding socket\n" << std::endl;
        // exit program
        exit(1);
    }

    if (listen(socket_fd, MAX_CONNECTIONS) < 0)
    {
        std::cout << "Error listening on socket\n" << std::endl;
        exit(1);
    }

    while (true)
    {
        struct sockaddr_in client_address;
        socklen_t client_address_length = sizeof(client_address);

        std::cout << "Waiting for connection..." << std::endl;
        // accept connection
        int client_socket = accept(socket_fd, (struct sockaddr *)&client_address, &client_address_length);
        if (client_socket < 0)
        {
            // print error message
            std::cout << "Error accepting connection" << std::endl;
            // exit program
            exit(1);
        }

        std::cout << "Connection accepted (" << client_socket << ")\n" << std::endl;

        // create thread to handle connection
        std::thread t(handle_connection, client_socket, stdin_fd);
        t.detach();
    }
}

void Server::start_java_srv()
{
    // create thread

    // execute java application
    std::string command = JAVA_PATH;
    std::string cmd_args = "";

    // add memory arguments
    cmd_args += "-Xms" + std::to_string(min_mem) + "m ";
    cmd_args += "-Xmx" + std::to_string(max_mem) + "m ";
    cmd_args += JAVA_ARGS;

    std::vector<char *> args;
    std::string arg;
    for (int i = 0; i < cmd_args.length(); i++)
    {
        // check if character is a space
        if (cmd_args[i] == ' ')
        {
            // add argument to array
            args.push_back(strdup(arg.c_str()));
            // clear argument
            arg = "";
        }
        else
        {
            // add character to argument
            arg += cmd_args[i];
        }
    }

    // process additional arguments
    for (int i = 0; i < additional_args.size(); i++)
    {
        // add argument to array
        args.push_back(strdup(additional_args[i]));
    }

    // add null pointer to end of array
    args.push_back(NULL);

    // setup pipe to allow socket listener to write to stdin
    int stdin_fd[2];
    if (pipe(stdin_fd) < 0)
    {
        // print error message
        std::cout << "Error creating pipe" << std::endl;
        // exit program
        exit(1);
    }
    // redirect stdin to pipe
    dup2(stdin_fd[0], 0);

    // start socket listener
    int pid = fork();
    if (pid == 0)
    {
        // close read end of pipe
        close(stdin_fd[0]);
        // start socket listener
        socket_listen(stdin_fd[1]);
    }
    else if (pid < 0)
    {
        // error
        // print error message
        std::cout << "Error forking process" << std::endl;
        // exit program
        exit(1);
    } else {
        // close write end of pipe
        close(stdin_fd[1]);
    }

    std::cout << "Starting server..." << std::endl;

    // convert argument array to char* array
    char **argv = new char *[args.size()];
    std::copy(args.begin(), args.end(), argv);


    // redirect stdout to log file
    freopen(LOG_PATH, "w", stdout);
    // redirect stderr to debug log file
    freopen(LOG_PATH, "a", stderr);
    // change working directory to server directory
    chdir("./server");
    // execute command
    execv(command.c_str(), argv);
}

void Server::start() {
    this->server_thread = std::thread(&Server::start_java_srv, this);
}

void Server::wait()
{
    // wait for server thread to finish then return control to main thread
    // i.e., wait for thread to exit
    if (this->server_thread.joinable()) {
        this->server_thread.join();
    }
}

Server::~Server()
{
    // close client socket
    close(client_socket);
    // close server socket
    close(server_socket);
    // delete socket file
    unlink(CMD_PATH);
}