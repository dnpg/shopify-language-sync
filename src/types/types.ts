export interface JsonData {
    [key: string]: JsonData | string;
}

export type RecursiveUpdate = (structureJson: JsonData, dataJson: JsonData) => JsonData;

export type Init = () => void;
