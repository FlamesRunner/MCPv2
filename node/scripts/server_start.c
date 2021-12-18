#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <sys/wait.h>
#include <sys/prctl.h>
#include <unistd.h>
#include <signal.h>
#include <errno.h>

#define CONSOLE_BUFFER_SIZE 8192 // 8192 bytes = 8KB
#define CMD_BUFFER_SIZE 1024     // Command buffer
#define READ_END 0
#define WRITE_END 1
#define MAX_ARG_LEN 50
#define NUM_CONNECTIONS 100
#define CMD_PATH "mcp_in.sock"
#define LOG_PATH "./server/server_console.log"

int process_terminated = 0;
int java_pid = -1;
int listener_pid = -1;

void handler(int sig)
{
    int status = -1;
    int pid = -1;
    while (pid = waitpid((pid_t)(-1), &status, WNOHANG) > 0)
    {
        if (pid == java_pid && WIFEXITED(status) && pid > 0)
        {
            kill(listener_pid, SIGTERM);
            process_terminated = 1;
        }
    }
}

/**
 * start_server: given max_ram and min_ram with console_fileno, cmd_fileno to return,
 * we start a java process calling the jarfile ../server/server.jar with max_ram and
 * min_ram as constraints, and supply the caller with the console file descriptor
 * and command file descriptor.
 **/
void start_server(int *max_ram, int *min_ram, int *console_fileno, int *cmd_fileno)
{
    int p[2];    // 0 = read, 1 = write
    int p_in[2]; // same as above
    if (pipe(p) == -1 || pipe(p_in) == -1)
    {
        perror("pipe");
        fprintf(stderr, "%s\n", strerror(errno));
        exit(errno);
    }

    int pid = fork();

    if (pid == 0)
    {
        // Child
        // Close unused pipe ends
        close(p[READ_END]);
        close(p_in[WRITE_END]);

        // Map pipes to descriptors
        dup2(p[WRITE_END], fileno(stdout));
        dup2(p[WRITE_END], fileno(stderr));
        dup2(p_in[READ_END], fileno(stdin));

        // Close unused pipes
        close(p[WRITE_END]);
        close(p_in[READ_END]);

        // Copy max_ram and min_ram integers to char arrays
        char max_ram_str[MAX_ARG_LEN];
        char min_ram_str[MAX_ARG_LEN];
        sprintf(max_ram_str, "%d", *max_ram);
        sprintf(min_ram_str, "%d", *min_ram);

        char *min_ram_full = calloc(MAX_ARG_LEN * 2, sizeof(char));
        char *max_ram_full = calloc(MAX_ARG_LEN * 2, sizeof(char));
        strcpy(min_ram_full, "-Xms");
        strcpy(max_ram_full, "-Xmx");
        strcat(min_ram_full, min_ram_str);
        strcat(max_ram_full, max_ram_str);
        strcat(min_ram_full, "M");
        strcat(max_ram_full, "M");

        int chdir_ret = chdir("./server");
        if (chdir_ret == -1)
        {
            fprintf(stderr, "Failed to change directories.\n");
            perror("chdir");
            fprintf(stderr, "%s\n", strerror(errno));
            exit(errno);
        }
        int ret = execl("/usr/bin/java", min_ram_full, max_ram_full, "-jar", "server.jar", "nogui", (char *)0);
        fprintf(stderr, "Failed to start server (err: %s)\n", strerror(errno));
        exit(errno);
    }
    else
    {
        java_pid = pid;
        signal(SIGCHLD, handler);
    }
    close(p[WRITE_END]);
    *(console_fileno) = p[READ_END];
    *(cmd_fileno) = p_in[WRITE_END];
}

/**
 * read_cmd: expose unix socket on CMD_PATH where commands can be fed in, and cmd_fd contains the file descriptor where commands are to be fed
 **/
void read_cmd(int cmd_fd)
{
    int curr_pid = fork();
    if (curr_pid == 0)
    {
        prctl(PR_SET_PDEATHSIG, SIGHUP);
        
        chdir("./server");
        struct sockaddr_un address, client_address;
        address.sun_family = AF_UNIX;
        strcpy(address.sun_path, CMD_PATH);
        unlink(CMD_PATH);

        int fd = socket(AF_UNIX, SOCK_STREAM, 0);
        bind(fd, (struct sockaddr *)(&address), sizeof(address));
        listen(fd, NUM_CONNECTIONS);

        int newsockfd;
        int clilen = sizeof(client_address);

        while (newsockfd = accept(fd, (struct sockaddr *)&client_address, &clilen))
        {
            int proc = fork();
            if (proc == 0)
            {
                // Child
                prctl(PR_SET_PDEATHSIG, SIGHUP);
                char buf[CMD_BUFFER_SIZE];
                int n = 0;
                while ((n = read(newsockfd, buf, sizeof(buf) - 1)) > 0)
                {
                    buf[n] = '\n';
                    int b = write(cmd_fd, buf, n);
                }
                close(newsockfd);
                exit(0);
            }
            else
            {
                signal(SIGCHLD, SIG_IGN);
            }
        }
    }
    else
    {
        listener_pid = curr_pid;
    }
}

int main(int argc, char **argv)
{
    if (argc != 3)
    {
        fprintf(stderr, "Invalid number of arguments. Usage:");
        fprintf(stderr, "%s max_ram min_ram\n", argv[0]);
        exit(1);
    }
    else if (strlen(argv[1]) > MAX_ARG_LEN || strlen(argv[2]) > MAX_ARG_LEN)
    {
        fprintf(stderr, "Arguments are limited to %d characters in length.\n", MAX_ARG_LEN); // Enforce argument length so that start_server can assume that the length is <= MAX_ARG_LEN
        exit(1);
    }
    FILE *console_ptr = fopen(LOG_PATH, "w");
    int console_fileno, cmd_fileno;

    // Parse argv[1] as max_ram and argv[2] as min_ram
    int max_ram = atoi(argv[1]);
    int min_ram = atoi(argv[2]);

    if (max_ram < min_ram)
    {
        fprintf(stderr, "max_ram must be greater than min_ram.\n");
        exit(1);
    }

    if (console_ptr == NULL)
    {
        fprintf(stderr, "Failed to open console.txt.\n");
        exit(1);
    }

    if (min_ram < 512)
    {
        fprintf(stderr, "min_ram must be greater than 512 (megabytes).\n");
        exit(1);
    }

    start_server(&max_ram, &min_ram, &console_fileno, &cmd_fileno);
    read_cmd(cmd_fileno);

    int n;
    char buffer[CONSOLE_BUFFER_SIZE];
    while ((n = read(console_fileno, buffer, sizeof(buffer))) > 0 && process_terminated == 0)
    {
        write(STDOUT_FILENO, buffer, n);       // Write to stdout
        write(fileno(console_ptr), buffer, n); // Write to console logfile
    }
    close(console_fileno);
    fclose(console_ptr);
    return 0;
}
