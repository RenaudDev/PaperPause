
import crypto from 'crypto';

/**
 * Duplicate of the logic in production-schedule.ts for verification
 */
function getCollectionDay(collectionName: string): number {
    const hash = crypto.createHash('md5').update(collectionName).digest('hex');
    const intVal = parseInt(hash.substring(0, 8), 16);
    return intVal % 7;
}

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const counts = new Array(7).fill(0);
const collections = [];

// Generate 50 dummy collections
for (let i = 0; i < 50; i++) {
    collections.push(`category/collection-${i}`);
}

// Add some real names
collections.push('animals/cats');
collections.push('animals/dogs');
collections.push('fantasy/dragons');
collections.push('nature/forests');

console.log('--- Distribution Check ---');
collections.forEach(c => {
    const day = getCollectionDay(c);
    counts[day]++;
    if (['animals/cats', 'animals/dogs'].includes(c)) {
        console.log(`${c} -> ${days[day]} (${day})`);
    }
});

console.log('\n--- Counts per Day (Total: ' + collections.length + ') ---');
counts.forEach((count, i) => {
    console.log(`${days[i]}: ${count} (${(count / collections.length * 100).toFixed(1)}%)`);
});

// Check balance
const min = Math.min(...counts);
const max = Math.max(...counts);
console.log(`\nSpread: Min ${min}, Max ${max}`);

if (min > 0 && max < 20) {
    console.log('✅ Distribution looks reasonable.');
} else {
    console.log('⚠️ Distribution might be skewed.');
}
