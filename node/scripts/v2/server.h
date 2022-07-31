#include <thread>
#include <iostream>
#include <netinet/in.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>
#include <errno.h>
#include <sys/types.h>
#include <sys/un.h>
#include <vector>

// define server class
class Server
{
public:
    // constructor
    Server(int min_mem, int max_mem, std::vector<char *> additional_args);
    // destructor
    ~Server();
    // start server
    void start();
    // wait for server to finish
    void wait();
    void stop();

private:
    void start_java_srv();
    void redir_std();
    // server socket
    int server_socket;
    // client socket
    int client_socket;
    // server thread
    std::thread server_thread;
    // memory limit
    int min_mem;
    int max_mem;
    // client address
    struct sockaddr_in client_address;
    // client address length
    socklen_t client_address_length;
    std::vector<char *> additional_args;
    std::vector<std::thread> client_threads;
};