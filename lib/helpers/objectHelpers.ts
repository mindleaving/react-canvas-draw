import type { GenericObject } from "../types/frontendTypes";
import { areEquivalent } from "./collectionHelpers";

export const isEqual = (obj1: object, obj2: object) => {
    if(obj1 === obj2) {
        return true;
    }
    const obj1Keys = Object.keys(obj1);
    const obj2Keys = Object.keys(obj2);
    if(!areEquivalent(obj1Keys, obj2Keys)) {
        return false;
    }
    for (const key of obj1Keys) {
        const property1 = obj1[key as keyof typeof obj1];
        const property2 = obj2[key as keyof typeof obj2];
        if(typeof property1 !== typeof property2) {
            return false;
        }
        switch(typeof property1) {
            case "object":
            {
                if(!isEqual(property1 as GenericObject, property2 as GenericObject)) {
                    return false;
                }
                break;
            }
            case "bigint":
            case "boolean":
            case "number":
            case "string":
            case "undefined":
            {
                if(property1 !== property2) {
                    return false;
                }
                break;
            }
            default:
                // Ignore functions and symbols
                break;
        }
    }
    return true;
}