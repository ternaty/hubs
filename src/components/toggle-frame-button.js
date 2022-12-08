import { findAncestorWithComponent } from "../utils/scene-graph";

AFRAME.registerComponent("toggle-frame-button", {
  init() {
    this.updateSrc = () => {
      if (!this.targetEl.parentNode) return; // If removed
      const src = (this.src = this.targetEl.components["media-loader"].data.src);
      this.el.object3D.visible = false;
    };

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.targetEl = networkedEl;
      this.targetEl.addEventListener("media_resolved", this.updateSrc, { once: true });
      this.updateSrc();
    });

    this.onClick = () => {
      //console.log('clicked button')
      let framedEl = findAncestorWithComponent(this.el, "farvel-frame");
      if (!framedEl) {
        let netFramedEl = findAncestorWithComponent(this.el, "farvel-frame-networker");
        if (!netFramedEl) return;
        NAF.utils.takeOwnership(netFramedEl);
        let currentVal = netFramedEl.components["farvel-frame-networker"].data.defaultEnabled;
        netFramedEl.setAttribute("farvel-frame-networker", { defaultEnabled: !currentVal });
      } else {
        NAF.utils.takeOwnership(framedEl);
        let currentVal = framedEl.components["farvel-frame"].data.defaultEnabled;
        framedEl.setAttribute("farvel-frame", { defaultEnabled: !currentVal });
      }
    };
  },

  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
  },

  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
  }
});
