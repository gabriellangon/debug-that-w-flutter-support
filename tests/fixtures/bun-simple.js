// Simple test fixture for Bun debugging
debugger; // Should trigger a pause

function greet(name) {
	const message = `Hello, ${name}!`;
	console.log(message);
	return message;
}

const x = 42;
const greeting = greet("Bun");
console.log("x =", x);
