import { runProductDiscovery } from "../lib/discovery-engine";

console.log("--- TEST 2: Follow-up 'Show me something cheaper' ---");
const initial = runProductDiscovery("I need a laptop under ₹80k for coding.");
console.log("Initial top pick:", initial.products[0]?.name, initial.products[0]?.price_inr);

const cheaper = runProductDiscovery("Show me something cheaper", initial.requirements);
console.log("Cheaper picks:", cheaper.products.map(p => ({ name: p.name.slice(0, 30), price: p.price_inr, tradeoff: p.tradeoffType })));

console.log("\n--- TEST Battery: 'Which one has the best battery?' ---");
const battery = runProductDiscovery("Which one has the best battery?", initial.requirements);
console.log("Battery picks:", battery.products.map(p => ({ name: p.name.slice(0, 30), price: p.price_inr, reasons: p.reasons })));

console.log("\n--- TEST Increase Budget: 'What if I increase my budget to 90k?' ---");
const higher = runProductDiscovery("What if I increase my budget to 90k?", initial.requirements);
console.log("Updated budget:", higher.requirements.budgetInr);
console.log("Higher picks:", higher.products.map(p => ({ name: p.name.slice(0, 30), price: p.price_inr, tradeoff: p.tradeoffType })));

console.log("\n--- TEST Remove Gaming: 'Remove gaming from my requirements' ---");
const withGaming = runProductDiscovery("I need a laptop for college, coding and gaming under 80k.");
console.log("Before remove gaming useCases:", withGaming.requirements.useCases);
const withoutGaming = runProductDiscovery("Remove gaming from my requirements", withGaming.requirements);
console.log("After remove gaming useCases:", withoutGaming.requirements.useCases);
console.log("Products without gaming:", withoutGaming.products.map(p => p.name.slice(0, 30)));
