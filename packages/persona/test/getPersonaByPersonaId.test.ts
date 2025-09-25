import { describe, expect, it, vi } from "vitest";
import { getPersonaByPersonaId } from "../src/getPersonasByPersonaId.js";

describe("getPersonasByPersonaId", () => {
	it("returns a persona", async () => {
		// arrange
		const id = 22;

		// act
		const result = await getPersonaByPersonaId({
			personaId: id,
		});

		// assert
		expect(result).toBeDefined
		expect(result.personaId).toBe(id);
	});

	describe("getPersonasByPersonaId", () => {
		it("returns a persona when a matching ID is found", async () => {
			// arrange
			const id = 21;

			vi.mock("rocky-motors-database", () => {
				return {
					DatabaseManager: {
						getPersonasByPersonaId: async (personaId: number) => {
							return [
								{
									personaId,
									personaName: "test",
									personaDescription: "test",
									personaImage: "test",
								},
							];
						},
					},
				};
			});


			// act
			const result = await getPersonaByPersonaId({ personaId: id });

			// assert
			expect(result).toBeDefined
			expect(result.personaId).toBe(id);
		});

		it("returns undefined when no matching ID is found", async () => {
			// arrange
			const id = 3;

			// act & assert
			await expect(
				getPersonaByPersonaId({
					personaId: id,
				}),
			).resolves.toBe(undefined)
		});
	});
});
