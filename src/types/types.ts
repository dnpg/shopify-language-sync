export interface JsonData {
    [key: string]: object | string;
}

export type RecursiveUpdate = (structureJson: JsonData, dataJson: JsonData) => JsonData;
