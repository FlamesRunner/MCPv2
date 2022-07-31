// import standard libraries
#include <iostream>
#include <string>
#include <vector>
#include <stdio.h>

// include server class
#include "server.h"

// define main function
int main(int argc, char* argv[]) {
    // check if the number of arguments is correct
    if (argc < 3) {
        std::cout << "Usage: " << argv[0] << " min_ram max_ram" << std::endl;
        return 1;
    }

    std::vector<char *> additional_args;

    if (argc > 3) {
        std::cout << "Using additional arguments: ";
        for (int i = 3; i < argc; i++) {
            std::cout << argv[i] << " ";
            additional_args.push_back(strdup(argv[i]));
        }
        std::cout << std::endl;
    }

    // get memory limits
    int min_mem = atoi(argv[1]);
    int max_mem = atoi(argv[2]);
    // create server
    std::cout << "Creating server..." << std::endl;
    // create server
    Server server(min_mem, max_mem, additional_args);
    // start server
    server.start();
    // wait for server to finish
    std::cout << "Watching server thread..." << std::endl;
    server.wait();
    // server thread ended; stop client threads
    server.stop();

    // destroy server
    std::cout << "Destroying server..." << std::endl;
    delete &server;

    // return 0
    return 0;
}
