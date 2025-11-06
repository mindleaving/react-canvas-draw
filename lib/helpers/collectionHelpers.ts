export const last = <T>(collection: T[]): T | undefined => {
    if(collection.length === 0) {
        return undefined;
    }
    return collection[collection.length - 1];
}