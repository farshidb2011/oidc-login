let debug = false;

export const debugLog = (...args: any[]) => {
    if (debug) {
        console.log(...args);
    }
};

export const setDebug = (value: boolean) => {
    debug = value;
};

