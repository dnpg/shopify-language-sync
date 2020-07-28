export interface JsonData {
    [key: string]: JsonData | string;
}
export declare type RecursiveUpdate = (structureJson: JsonData, dataJson: JsonData) => JsonData;
export declare type Init = () => void;
