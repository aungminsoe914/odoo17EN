/** @odoo-module */
import { ClosePosPopup } from "@point_of_sale/app/navbar/closing_popup/closing_popup";
import { patch } from "@web/core/utils/patch";
import { useService } from "@web/core/utils/hooks";

patch(ClosePosPopup.prototype, {
    setup() {
        super.setup();
        this.printer = useService("printer");
    },
    async closeSession() {
        try {
            if (this.pos.useBlackBoxBe() && this.pos.checkIfUserClocked()) {
                await this.pos.clock(this.printer, false);
            }
            if (this.pos.useBlackBoxBe()) {
                await this.orm.call("pos.session", "check_everyone_is_clocked_out", [
                    this.pos.pos_session.id,
                ]);
            }
            this.pos.userSessionStatus = await this.pos.getUserSessionStatus();
            const result = await super.closeSession();
            if (result === false && this.pos.useBlackBoxBe() && !this.pos.checkIfUserClocked()) {
                await this.pos.clock(this.printer, true);
            }
            this.pos.userSessionStatus = await this.pos.getUserSessionStatus();
            return result;
        } catch (error) {
            if (this.pos.useBlackBoxBe() && !this.pos.checkIfUserClocked()) {
                await this.pos.clock(this.printer, true);
            }
            this.pos.userSessionStatus = await this.pos.getUserSessionStatus();
            throw error;
        }
    },
});
