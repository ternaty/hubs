export class FarvelFrameSys {
  constructor(scene) {
    this.scene = scene;
    this.zOffset = { default: null };
  }

  tick() {
    //Initial checks and apply spoke data
    if (!window.APP["farvelFrame"] || !window.APP["farvelFrame"].farvelFrame) return;
    this.zOffset = window.APP["farvelFrame"].zOffset;

    //Query all images and interactable elements
    const mediaImages = Array.from(document.querySelectorAll("[media-image]"));
    const interactables = Array.from(document.querySelectorAll(".interactable"));

    //Determine which mediaImages have an interactable element at the zOffset
    mediaImages.forEach(e => {
      //Initial check
      if (e.id === "batch-prep") return;

      //Return if media image is already assigned [farvel frame networker]
      if (e.components["farvel-frame-networker"] || e.components["farvel-frame"]) return;

      //Loop Interactable Elements
      for (let i = 0; i < interactables.length; i++) {
        //Calc distance
        let dist = e.object3D.position.distanceTo(interactables[i].object3D.position);
        
        //Determine if distance close enough to zOffset
        if (Math.abs(dist) <= Math.abs(this.zOffset) + 0.001 && Math.abs(dist) >= Math.abs(this.zOffset) - 0.001) {
          //Set farvel frame networker
          e.setAttribute("farvel-frame-networker", { frameEl: interactables[i] });

          //Remove hoverability
          let buttonEl = e.querySelector("[toggle-frame-button]");
          if (!buttonEl) return;
          buttonEl.object3D.visible = true;
          buttonEl.matrixAutoUpdate = true;
        }
      }
    });
  }
}
