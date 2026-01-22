import { useState } from "react"
import { isEqual } from "./objectHelpers";

export const useDeepEqualityMemo = <T extends object>(props: T): T => {
    const [ memorizedProps, setMemorizedProps ] = useState<T>(props);

    if(isEqual(props, memorizedProps)) {
        return memorizedProps;
    }
    setMemorizedProps(props);
    return props;
}