/**
 *
 * @param value
 * @return {boolean}
 */
export function isObject(value) {
    return value && typeof value === 'object' && value.constructor === Object;
}

/**
 *
 * @param nestedData
 * @param initialValue
 * @return {*}
 */
export function getRollupKeys(nestedData,initialValue) {
    let _initialValue = initialValue || [];
    return Object.keys(nestedData).reduce(
        (acc, keys) => acc.concat(Object.keys(nestedData[keys])
            .filter((x) => acc.indexOf(x) === -1)),
        _initialValue
    );
}
