// Order processor — fetches order from payment API and calculates total

interface Order {
  product: string;
  price: number;
  qty: number;
  shipping: number;
}

async function fetchOrder(): Promise<Order> {
  // In production this would be: fetch("https://api.acme.com/orders/ORD-2847")
  const file = Bun.file("./api-response.json");
  return file.json();
}

function processOrder(order: Order) {
  const subtotal = order.price * order.qty;
  const total = subtotal + order.shipping;
  return { product: order.product, subtotal, shipping: order.shipping, total };
}

const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;

async function main() {
  const order = await fetchOrder();
  const result = processOrder(order);

  console.log(bold("\nOrder Summary"));
  console.log(dim("─".repeat(32)));
  console.log(`  Product:  ${cyan(result.product)}`);
  console.log(`  Subtotal: ${green("$" + result.subtotal)}`);
  console.log(`  Shipping: ${green("$" + result.shipping)}`);
  console.log(dim("─".repeat(32)));
  console.log(`  Total:    ${bold("$" + result.total)}`);

  const expected = 89.99 * 2 + 12.50;
  if (result.total !== expected) {
    console.log(`\n${red("✗ ERROR:")} expected ${green("$" + expected)} but got ${red('"' + result.total + '"')}`);
    process.exit(1);
  }
}

main();
