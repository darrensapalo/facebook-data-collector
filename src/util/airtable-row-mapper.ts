export function cleanRowEntry(object: any): any {
    return {
        fields: {
            ...object.fields
        },
        createdAt: object._rawJson.createdTime,
        table: {
            name: object._table.name
        }
    };
}