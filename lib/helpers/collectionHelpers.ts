export const last = <T>(collection: T[]): T | undefined => {
    if(collection.length === 0) {
        return undefined;
    }
    return collection[collection.length - 1];
}
export const areEquivalent = (collection1: string[], collection2: string[]): boolean => {
    if(collection1.length !== collection2.length) {
        return false;
    }
    const sortedCollection1 = [ ...collection1 ].sort((a,b) => a.localeCompare(b));
    const sortedCollection2 = [ ...collection2 ].sort((a,b) => a.localeCompare(b));
    for (let index = 0; index < sortedCollection1.length; index++) {
        const item1 = sortedCollection1[index];
        const item2 = sortedCollection2[index];
        if(item1 !== item2) {
            return false;
        }
    }
    return true;
}