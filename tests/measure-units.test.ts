import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDistance, formatArea } from '../src/utils/geo-calculations';

// Numbers are punctuated in the reader's locale, which defaults to the
// machine's; every assertion names one so the suite reads the same everywhere.
const EN = 'en-US';
const NL = 'nl-NL';

// The two systems are separate ladders, not a conversion applied to a formatted
// metric string: each switches unit where its own smaller unit stops being
// readable (1000 m, 5280 ft), and those are different distances.

test('metric distance keeps three significant digits within a unit', () => {
    assert.equal(formatDistance(52300, 'metric', EN), '523 m');
    assert.equal(formatDistance(100100, 'metric', EN), '1.001 km');
    assert.equal(formatDistance(1006 * 1000 * 100, 'metric', EN), '1,006 km');
});

test('imperial distance switches from feet to miles at one mile', () => {
    // A mile is 5280 ft exactly; a hundred feet short of it must still read in feet.
    const mileCm = 5280 * 30.48;
    assert.equal(formatDistance(mileCm - 3048, 'imperial', EN), '5,180 ft');
    assert.equal(formatDistance(mileCm, 'imperial', EN), '1.000 mi');
});

test('New York to London reads in both systems', () => {
    // 5570 km, the distance the doc page uses as its global example.
    const cm = 5570 * 1000 * 100;
    assert.equal(formatDistance(cm, 'metric', EN), '5,570 km');
    assert.equal(formatDistance(cm, 'imperial', EN), '3,461 mi');
});

test('a garden is square feet, a field is acres, a country is square miles', () => {
    assert.equal(formatArea(120, 'imperial', EN), '1,292 sq ft');
    assert.equal(formatArea(50000, 'imperial', EN), '12.36 acres');
    assert.equal(formatArea(1.5e11, 'imperial', EN), '57,915 sq mi');
});

test('metric area steps m² → ha → km²', () => {
    assert.equal(formatArea(9999, 'metric', EN), '9,999 m²');
    assert.equal(formatArea(50000, 'metric', EN), '5.00 ha');
    assert.equal(formatArea(5e6, 'metric', EN), '5.000 km²');
});

test('the unit system only changes the reading, never the measurement', () => {
    // Same input, both systems, converted back: within a rounding step of each other.
    const cm = 1234567;
    const metres = Number(formatDistance(cm, 'metric', EN).replace(' km', '')) * 1000;
    const miles = Number(formatDistance(cm, 'imperial', EN).replace(' mi', ''));
    assert.ok(Math.abs(metres - miles * 1609.344) < 10, `${metres} vs ${miles} mi`);
});

test('large numbers are grouped, in the punctuation of the reader locale', () => {
    // Grouping and the decimal mark come from the same locale, or Dutch 1.001 km
    // (a thousand and one) and English 1.001 km (one) would be the same string.
    assert.equal(formatArea(602696e6, 'metric', NL), '602.696 km²');
    assert.equal(formatDistance(15835 * 1000 * 100, 'metric', NL), '15.835 km');
    assert.equal(formatDistance(100100, 'metric', NL), '1,001 km');
    assert.equal(formatArea(602696e6, 'metric', EN), '602,696 km²');
    assert.equal(formatDistance(100100, 'metric', EN), '1.001 km');
});
