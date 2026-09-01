import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDistance, formatArea } from '../src/utils/geo-calculations';

// The two systems are separate ladders, not a conversion applied to a formatted
// metric string: each switches unit where its own smaller unit stops being
// readable (1000 m, 5280 ft), and those are different distances.

test('metric distance keeps three significant digits within a unit', () => {
    assert.equal(formatDistance(52300), '523 m');
    assert.equal(formatDistance(100100), '1.001 km');
    assert.equal(formatDistance(1006 * 1000 * 100), '1006 km');
});

test('imperial distance switches from feet to miles at one mile', () => {
    // A mile is 5280 ft exactly; a hundred feet short of it must still read in feet.
    const mileCm = 5280 * 30.48;
    assert.equal(formatDistance(mileCm - 3048, 'imperial'), '5180 ft');
    assert.equal(formatDistance(mileCm, 'imperial'), '1.000 mi');
});

test('New York to London reads in both systems', () => {
    // 5570 km, the distance the doc page uses as its global example.
    const cm = 5570 * 1000 * 100;
    assert.equal(formatDistance(cm), '5570 km');
    assert.equal(formatDistance(cm, 'imperial'), '3461 mi');
});

test('a garden is square feet, a field is acres, a country is square miles', () => {
    assert.equal(formatArea(120, 'imperial'), '1292 sq ft');
    assert.equal(formatArea(50000, 'imperial'), '12.36 acres');
    assert.equal(formatArea(1.5e11, 'imperial'), '57915 sq mi');
});

test('metric area steps m² → ha → km²', () => {
    assert.equal(formatArea(9999), '9999 m²');
    assert.equal(formatArea(50000), '5.00 ha');
    assert.equal(formatArea(5e6), '5.000 km²');
});

test('the unit system only changes the reading, never the measurement', () => {
    // Same input, both systems, converted back: within a rounding step of each other.
    const cm = 1234567;
    const metres = Number(formatDistance(cm).replace(' km', '')) * 1000;
    const miles = Number(formatDistance(cm, 'imperial').replace(' mi', ''));
    assert.ok(Math.abs(metres - miles * 1609.344) < 10, `${metres} vs ${miles} mi`);
});
