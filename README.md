# Shinkai Typescript Lib

The Shinkai Typescript Lib is a powerful library designed for building and managing Shinkai messages in Typescript applications. Shinkai messages are the main primitive of the Shinkai Network and it's using for communication with a Shinkai Node. This guide will walk you through the basics of using the library, from installation to creating and sending messages.

Note: This is a native Typescript library, unlike the other library available in the Shinkai Network, which is in WASM wrapped with Typescript.

## Installation

To get started, install the Shinkai Typescript Lib via npm:

```bash
npm install @shinkai_protocol/shinkai-typescript-lib
```

## How To Communicate With a Shinkai Node

If the node is in a pristine state, we need to register a new profile (with a device) before we can create a job or send a message. This involves generating two pairs of encryption and signature keys and using them to construct a registration message.

Usually the most basic flow is: create job, send message to job, get messages from inbox.

## How To Create a Shinkai Message (Examples)

For detailed examples demonstrating how to use the Shinkai Typescript Lib for various tasks, check out our [docs](docs/README.md). These examples cover a range of use cases from basic to advanced, helping you get started with the library quickly.

Each example is fully documented to explain the concepts and features being used, making it easy to understand how to integrate Shinkai Typescript Lib into your own projects.

## License

The Shinkai Typescript Lib is open-source software licensed under the [MIT License](LICENSE). This means you can use, modify, and distribute it freely, provided you include the original copyright and license notice in any copies or substantial portions of the software.

For more details, see the [LICENSE](LICENSE) file in the project repository.