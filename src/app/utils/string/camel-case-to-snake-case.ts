export function toSnakeCase(
	obj: Record<string, unknown>,
): Record<string, unknown> {
	if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
		return obj;
	}

	const newObject: Record<string, unknown> = {};

	for (const key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
			newObject[snakeKey] = obj[key];
		}
	}

	return newObject;
}
