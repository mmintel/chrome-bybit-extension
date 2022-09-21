import { ValueUnit } from "./types";

export const parseVal = (str?: string): ValueUnit => {
    if (!str) {
        return {
            val: 0,
            unit: '',
        };
    }
    
    const res = str.split(" ");

    if (!res) {
        return {
            val: 0,
            unit: '',
        };
    }

    const val = parseFloat(res[0].replace(/,/g, ''));
    const unit = res[1];

    return {
        val: Number.isNaN(val) ? 0 : val,
        unit: unit ?? '',
    }
}