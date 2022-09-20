export const parseVal = (str: string) => {
    const res = str.split(" ");

    if (!res) {
        return {
            val: 0,
            unit: '',
        };
    }

    return {
        val: parseFloat(res[0].replace(/,/g, '')),
        unit: res[1]
    }
}