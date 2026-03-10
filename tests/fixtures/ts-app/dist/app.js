"use strict";
function greet(person) {
    const message = `Hello, ${person.name}! Age: ${person.age}`;
    if (person.name === "Alice") {
        const a = 1;
        return "Hello, Alice!";
    }
    return message;
}
function add(a, b) {
    const result = a + b;
    return result;
}
const alice = { name: "Alice", age: 30 };
const greeting = greet(alice);
const sum = add(2, 3);
console.log(greeting);
console.log("Sum:", sum);
//# sourceMappingURL=app.js.map