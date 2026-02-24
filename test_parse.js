const parseGroupedLine = (msg) => {
    if (!msg) return [];
    const lines = msg.split('\n');
    const results = [];
    lines.forEach(line => {
        const regex = /(.+?)\s*x\s*(\d+)n?/gi;
        let match;
        while ((match = regex.exec(line)) !== null) {
            let leftPart = match[1];
            const amount = parseInt(match[2], 10);
            if (leftPart.indexOf(':') >= 0) {
                leftPart = leftPart.substring(leftPart.indexOf(':') + 1);
            }
            const tokens = leftPart.split(',').map(n => n.trim()).filter(Boolean);
            tokens.forEach(token => {
                results.push({ item: token, amount });
            });
        }
    });
    return results;
};

console.log('--- De ---');
console.log(parseGroupedLine("De: 12,13 x 20n, 15,16 x 10n"));
console.log('--- Kep ---');
console.log(parseGroupedLine("kep bang x 10n\nkep lech x 20"));
console.log('--- Tong ---');
console.log(parseGroupedLine("De Tong : 0,1,2 x 10n\nDe Tong : 3 x 20n"));
console.log('--- Bo ---');
console.log(parseGroupedLine("De cham 0 x 10n\nBo : 01,02 x 10n"));
