import { createPool, type DatabasePool, createSqlTag } from "slonik";
import { z } from "zod";

let slonik: DatabasePool;
let sql: ReturnType<typeof createSqlTag>;

function initSQL() {
    return createSqlTag({
        typeAliases: {
            vehicleWithOwner: z.object({
                vehicle_id: z.number(),
                skin_id: z.number(),
                flags: z.number(),
                class: z.number(),
                damage_info: z.instanceof(Buffer) || z.null(),
                owner_id: z.number(),
            }),
            dbPart: z.object({
                part_id: z.number(),
                parent_part_id: z.number(),
                branded_part_id: z.number(),
                percent_damage: z.number(),
                item_wear: z.number(),
                attachment_point_id: z.number(),
                owner_id: z.number(),
                part_name: z.string() || z.null(),
                repair_cost: z.number(),
                scrap_value: z.number(),
            }),
            id: z.number(),
            brandedPart: z.object({
                part_id: z.number() || z.null(),
                parent_part_id: z.number() || z.null(),
                branded_part_id: z.number() || z.null(),
                attachment_point_id: z.number() || z.null(),
            }),
            part: z.object({
                part_id: z.number(),
                parent_part_id: z.number(),
                branded_part_id: z.number(),
                percent_damage: z.number(),
                item_wear: z.number(),
                attachment_point_id: z.number(),
                part_name: z.string() || z.null(),
                owner_id: z.number(),
            }),
            abstractPartType: z.object({
                abstract_part_type_id: z.number(),
            }),
            ptSkin: z.object({
                skin_id: z.number(),
                default_flag: z.number(),
            }),
            nextPartId: z.object({
                next_val: z.bigint(),
            }),
            detailedPart: z.object({
                branded_part_id: z.number(),
                part_type_id: z.number(),
                abstract_part_type_id: z.number(),
                parent_abstract_part_type_id: z.number(),
                attachment_point_id: z.number(),
            }),
            vehicle: z.object({
                vehicle_id: z.number(),
                skin_id: z.number(),
                flags: z.number(),
                class: z.number(),
                info_setting: z.number(),
                damage_info: z.instanceof(Buffer) || z.null(),
            }),
            brand: z.object({
                brand_id: z.number(),
                brand: z.string(),
                is_stock: z.boolean(),
            }),
            player: z.object({
                player_id: z.number(),
                customer_id: z.number(),
                player_type_id: z.number(),
                sanctioned_scole: z.number(),
                challenge_score: z.number(),
                last_logged_in: z.date(),
                times_logged_in: z.number(),
                bank_balance: z.number(),
                num_cars_owned: z.number(),
                driver_style: z.number(),
                lp_code: z.number(),
                lp_text: z.string(),
                car_num1: z.string(),
                car_num2: z.string(),
                car_num3: z.string(),
                car_num4: z.string(),
                car_num5: z.string(),
                dd_number: z.string(),
                persona: z.string(),
                address: z.string(),
                residence: z.string(),
                vehicle_id: z.number(),
                current_race_id: z.number(),
                offline_driver_skill: z.number(),
                offline_grudge: z.number(),
                offline_reputation: z.number(),
                total_time_played: z.number(),
                car_info_setting: z.number(),
                stock_classic_class: z.number(),
                stock_muscle_class: z.number(),
                modified_classic_class: z.number(),
                modified_muscle_class: z.number(),
                outlaw_class: z.number(),
                drag_class: z.number(),
                challenge_rung: z.number(),
                offline_ai_car_class: z.number(),
                offline_ai_car_bpt_id: z.number(),
                offline_state: z.number(),
                body_type: z.number(),
                skin_color: z.number(),
                hair_color: z.number(),
                shirt_xolor: z.number(),
                parts_color: z.number(),
                offline_driver_style: z.number(),
                offline_driver_attitude: z.number(),
                evaded_fuzz: z.number(),
                pinks_won: z.number(),
                num_unread_mail: z.number(),
                total_races_won: z.number(),
                total_races_completed: z.number(),
                total_winnings: z.number(),
                insurance_risk_points: z.number(),
                insurence_rating: z.number(),
                challenge_races_run: z.number(),
                challenge_races_won: z.number(),
                challenge_raced_completed: z.number(),
                cars_lost: z.number(),
                cars_won: z.number()
            })
        },
    });
}

export async function getSlonik(): Promise<{
    slonik: DatabasePool;
    sql: ReturnType<typeof createSqlTag>;
}> {
    if (typeof process.env["DATABASE_URL"] === "undefined") {
        throw Error("Please set DATABASE_URL in your env.")
    }

    if (!slonik) {
        slonik = await createPool(process.env["DATABASE_URL"]!);
    }
    if (!sql) {
        sql = initSQL();
    }
    return { slonik, sql };
}

export async function getDatabase() {
    const { slonik, sql } = await getSlonik();
    return { slonik, sql };
}