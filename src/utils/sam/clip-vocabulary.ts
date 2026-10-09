/**
 * Words CLIP may *suggest* for a segment, next to the names the user chose.
 *
 * CLIP cannot invent a word: it only scores the texts it is given. To help
 * users find names that work, every named segment is also scored against this
 * list, and its best three go into the output. The list is the class names of
 * the remote-sensing caption datasets RemoteCLIP was trained on (RSICD,
 * UCMerced), worded the way their captions word them, plus what a Dutch
 * landscape has that those datasets lack (greenhouses, ditches, dikes, reed).
 * English, because CLIP reads English; each entry is put into the model's
 * template ("a satellite image of {label}.") like a user's name is.
 */
export const CLIP_SUGGESTION_VOCABULARY: readonly string[] = [
    // Built-up
    'dense residential area', 'medium residential area', 'sparse residential area', 'buildings',
    'a commercial area', 'an industrial area', 'a business park', 'a town centre', 'a church',
    'a school', 'a farm', 'a farmyard', 'greenhouses', 'storage tanks', 'a construction site',
    'solar panels', 'a mobile home park',
    // Transport
    'a road', 'a highway', 'an intersection', 'an overpass', 'a viaduct', 'a bridge', 'a railway',
    'a railway station', 'a parking lot', 'an airport', 'a runway', 'a harbor', 'a marina',
    // Open land
    'farmland', 'agricultural fields', 'a meadow', 'grassland', 'pasture', 'an orchard',
    'allotment gardens', 'bare land', 'a sand pit', 'a dike',
    // Green
    'a forest', 'trees', 'a tree row', 'a park', 'a golf course', 'a cemetery', 'shrubland',
    // Water and wet land
    'water', 'a river', 'a canal', 'a ditch', 'a lake', 'a pond', 'reeds', 'a marsh', 'a beach',
    // Recreation
    'a sports field', 'a playground', 'a stadium', 'a tennis court', 'a baseball field', 'a square',
];
