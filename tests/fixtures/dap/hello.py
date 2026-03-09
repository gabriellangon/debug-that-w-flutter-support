def greet(name):
    message = f"Hello, {name}!"
    return message


def main():
    x = 42
    y = x + 1
    result = greet("world")
    print(f"x={x} y={y}")
    print(result)
    return 0


if __name__ == "__main__":
    main()
