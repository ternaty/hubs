/* 'Farvel Frame' developed by Michael Morran July & August 2022 for Farvel
This feature automatically generates a child 3D element whenever a .png or .jpg are drag-and-dropped into hubs. In making these feature, a number of parameters have been made controllable in Spoke in the hierarchy on the scene level...

1. Enable Farvel Frame - Controls the presence of frames in the scene. If disabled, no frames will spawn on drag-and-dropped images.
2. Frames Visible By Default - Controls the starting size of frames once they load onto a drag-and-dropped image. If disabled, frames will be imperceptibly small when loading on drag-and-dropped images.
3. Frame Asset URL - The hosted link for the frame .glb. This should take .glbs hosted on the same server as the feature. Do not use sketchfab for hosting. 
4. Z-axis Offset - Controls the distance betweeen the image and the frame. This should be adjusted to properly situate pictures within each frame asset, ensuring that the image is not imbeded inside of the frame.
5. Asset Scale Settings - These parameters control the size of the frame asset relative to the image. 

For the implementation of this feature, the following changes have been made to the following directories and files. To query these changes, please search for comments between 'mike-frame' and 'mike-frame-end'.

space-client Branch: 'mike/farvel-frame-v2'

space-client Files Added:
  src/components/farvel-frame.js
  src/components/toggle-frame-button.js
  src/systems/farvel-frame-system.js

space-client Files Changed:
  src/gltf-component-mappings.js
    Lines 621 -> 625
  src/hub.html
    Lines 455 -> 457
  src/hub.js
    Lines 195 -> 198
  src/scene-entry-manager.js
    Lines 25 -> 27
    Lines 232 -> 257
  src/systems/hubs-systems.js
    Lines 37 -> 39
    Lines 83 -> 85
    Lines 133 -> 135

Spoke Branch: 'farvel-frame'

Spoke Files Added:
  scripts/deploy.js

Spoke Files Changes:
  package.json
    Line 26
  src/editor/nodes/SceneNode.js
    Lines 143 -> 156
    Lines 185 -> 193
    Lines 289 -> 297
    Lines 461 -> 471
  src/ui/properties/SceneNodeEditor.js 
    Lines 16 -> 18
    Lines 45 -> 53
    Lines 364 -> 413 (EDITS ARE IN REACT AND NOT COMMENTED WITH 'mike-frame')

For Spoke deployment, please follow this tutorial on a new file, please use this tutorial...
  A. yarn install
  B. yarn start
  C. Ensure scripts/deploy.js is present
  D. Ensure package.js has added the following deploy script: "deploy": "node -r esm -r @babel/register ./scripts/deploy.js",
  F. Create .ret.credentials file manually
  E. From your Hubs Client, copy and paste the .ret.credentials into Spoke's .ret.credentials
  G. yarn run deploy
*/

import { createImageTexture } from "../utils/media-utils";
import { TextureCache } from "../utils/texture-cache";
import defaultFrame from "../assets/models/DefaultPictureFrame.glb";

AFRAME.registerComponent("farvel-frame", {
  schema: {
    assetURL: {
      default: defaultFrame
    },
    zOffset: { default: -0.002 },
    scaleSetting: { default: { x: 3, y: 3, z: 1.5 } },
    defaultEnabled: { default: true },
    frameEl: { default: {} },
    isSmall: { default: false },
    ratio: { default: 1 },
    loaded: { default: false },
    smallScale: { default: 1 }
  },

  async init() {
    //Assign Spoke Data
    if (!window.APP["farvelFrame"] || !window.APP["farvelFrame"].farvelFrame) return;
    Object.assign(this.data, window.APP["farvelFrame"]);
    this.time = 0;

    if (this.data.assetURL == "") this.data.assetURL = defaultFrame; // MT: Workaround until fixed in spoke

    //Determine image pixel ratio
    const textureCache = new TextureCache();
    const { src, version } = this.el.components["media-image"].data;
    let promise = createImageTexture(src);
    let texture = await promise;
    let cacheItem = textureCache.set(src, version, texture);
    this.data.ratio = cacheItem.ratio;

    //Initialize networked frame element
    this.data.frameEl = document.createElement("a-entity");
    this.data.frameEl.setAttribute("media-loader", { src: this.data.assetURL, resolve: true });
    AFRAME.scenes[0].appendChild(this.data.frameEl);
    this.data.frameEl.setAttribute("networked", { template: "#interactable-media" });

    //Calculate initial element scale with asset settings and media pixel ratio
    let elScale = this.el.object3D.scale;
    if (this.data.ratio <= 1) {
      this.data.maxScale = new THREE.Vector3(
        elScale.x * this.data.scaleSetting.x,
        elScale.y * this.data.scaleSetting.y * this.data.ratio,
        elScale.z * this.data.scaleSetting.z
      );
    } else {
      this.data.maxScale = new THREE.Vector3(
        (elScale.x * this.data.scaleSetting.x) / this.data.ratio,
        elScale.y * this.data.scaleSetting.y,
        elScale.z * this.data.scaleSetting.z
      );
    }

    //Set initial element scale and zoffset
    this.data.frameEl.object3D.position.z = this.data.zOffset;
    if (this.data.defaultEnabled) {
      this.data.frameEl.setAttribute("scale", {
        x: this.data.maxScale.x,
        y: this.data.maxScale.y,
        z: this.data.maxScale.z
      });
      this.data.isSmall = false;
    } else {
      this.data.frameEl.setAttribute("scale", {
        x: this.data.maxScale.x * 0.0001,
        y: this.data.maxScale.x * 0.0001,
        z: this.data.maxScale.x * 0.0001
      });
      this.data.isSmall = true;
    }
    this.data.frameEl.object3D.matrixAutoUpdate = true;

    //On frame element loaded =>
    this.data.frameEl.addEventListener("media-loaded", () => {
      this.data.loaded = true;
      //Remove manipulation on frame
      this.data.frameEl.removeAttribute("is-remote-hover-target");

      //Add listener to determine if imageEl has been removed
      this.data.frameEl.setAttribute("framedEl-listener", { framedEl: this.el });

      //Set pinned and unpinned event listeners to influence frameEl
      this.el.addEventListener("pinned", () => {
        NAF.utils.takeOwnership(this.data.frameEl);
        const wasPinned = this.el.components.pinnable && this.el.components.pinnable.data.pinned;
        window.APP.pinningHelper.setPinned(this.data.frameEl, wasPinned);
      });
      this.el.addEventListener("unpinned", () => {
        NAF.utils.takeOwnership(this.data.frameEl);
        const wasPinned = this.el.components.pinnable && this.el.components.pinnable.data.pinned;
        window.APP.pinningHelper.setPinned(this.data.frameEl, wasPinned);
      });
    });
  },

  tick(t, dt) {
    //Init tick time and checks
    this.time += dt;
    if (!this.data.frameEl.object3D || this.data.isSmall === "" || !this.data.maxScale) return;

    //Track frameEl with image element
    this.data.frameEl.setAttribute("offset-relative-to", {
      target: "#" + this.el.id,
      offset: { x: 0, y: 0, z: this.data.zOffset },
      selfDestruct: true
    });
    let elScale = this.el.object3D.scale;
    this.data.maxScale = new THREE.Vector3(
      elScale.x * this.data.scaleSetting.x * this.data.smallScale,
      elScale.y * this.data.scaleSetting.y * this.data.smallScale,
      elScale.z * this.data.scaleSetting.z * this.data.smallScale
    );
    if (this.data.ratio <= 1) {
      this.data.frameEl.setAttribute("scale", {
        x: this.data.maxScale.x,
        y: this.data.maxScale.y * this.data.ratio,
        z: this.data.maxScale.z
      });
    } else {
      this.data.frameEl.setAttribute("scale", {
        x: this.data.maxScale.x / this.data.ratio,
        y: this.data.maxScale.y,
        z: this.data.maxScale.z
      });
    }

    //Update visibility based on defaultEnabled
    if (this.data.isSmall && this.data.defaultEnabled) {
      //make big
      this.data.isSmall = false;
      this.data.smallScale = 1;
    } else if (!this.data.isSmall && !this.data.defaultEnabled) {
      //make small
      this.data.isSmall = true;
      this.data.smallScale = 0.001;
    }

    //Remove frame button if frameEl detached
    if (!this.data.frameEl.attached) {
      let buttonEl = this.el.querySelector("[toggle-frame-button]");
      if (!buttonEl) return;
      buttonEl.object3D.visible = false;
      buttonEl.matrixAutoUpdate = true;
    }
  }
});

AFRAME.registerComponent("farvel-frame-networker", {
  schema: {
    assetURL: {
      default: defaultFrame
    },
    zOffset: { default: -0.002 },
    scaleSetting: { default: { x: 3, y: 3, z: 1.5 } },
    defaultEnabled: { default: true },
    frameEl: { default: {} },
    isSmall: { default: false },
    ratio: { default: 1 },
    smallScale: { default: 1 }
  },

  async init() {
    //Assign Spoke Data
    if (!window.APP["farvelFrame"] || !window.APP["farvelFrame"].farvelFrame) return;
    Object.assign(this.data, window.APP["farvelFrame"]);
    this.time = 0;

    if (this.data.assetURL == "") this.data.assetURL = defaultFrame; // MT: Workaround until fixed in spoke

    //Determine image pixel ratio
    const textureCache = new TextureCache();
    const { src, version } = this.el.components["media-image"].data;
    let promise = createImageTexture(src);
    let texture = await promise;
    let cacheItem = textureCache.set(src, version, texture);
    this.data.ratio = cacheItem.ratio;

    //Calculate initial element scale with asset settings and media pixel ratio
    let elScale = this.el.object3D.scale;
    if (this.data.ratio <= 1) {
      this.data.maxScale = new THREE.Vector3(
        elScale.x * this.data.scaleSetting.x,
        elScale.y * this.data.scaleSetting.y * this.data.ratio,
        elScale.z * this.data.scaleSetting.z
      );
    } else {
      this.data.maxScale = new THREE.Vector3(
        (elScale.x * this.data.scaleSetting.x) / this.data.ratio,
        elScale.y * this.data.scaleSetting.y,
        elScale.z * this.data.scaleSetting.z
      );
    }

    //Set initial scale and zoffset
    this.data.frameEl.object3D.matrixAutoUpdate = true;
    this.data.frameEl.removeAttribute("is-remote-hover-target");

    //Add listener to determine if imageEl has been removed and to transfer ownership to frameEl
    this.data.frameEl.setAttribute("framedEl-listener", { framedEl: this.el });
    // this.el.addEventListener("interact", () => {
    //   NAF.utils.takeOwnership(this.data.frameEl);
    // });

    //Set pinned and unpinned event listeners to influence frameEl
    this.el.addEventListener("pinned", () => {
      NAF.utils.takeOwnership(this.data.frameEl);
      const wasPinned = this.el.components.pinnable && this.el.components.pinnable.data.pinned;
      window.APP.pinningHelper.setPinned(this.data.frameEl, wasPinned);
    });
    this.el.addEventListener("unpinned", () => {
      NAF.utils.takeOwnership(this.data.frameEl);
      const wasPinned = this.el.components.pinnable && this.el.components.pinnable.data.pinned;
      window.APP.pinningHelper.setPinned(this.data.frameEl, wasPinned);
    });
  },

  tick(t, dt) {
    //Init tick time and checks
    this.time += dt;
    if (!this.data.frameEl.object3D || this.data.isSmall === "" || !this.data.maxScale) return;

    //Track frameEl with image element, but only when owned
    if (NAF.utils.isMine(this.el)) {
      this.data.frameEl.setAttribute("offset-relative-to", {
        target: "#" + this.el.id,
        offset: { x: 0, y: 0, z: this.data.zOffset },
        selfDestruct: true
      });

      //Check if sizing has changed and then set scale
      let elScale = this.el.object3D.scale;
      this.data.maxScale = new THREE.Vector3(
        elScale.x * this.data.scaleSetting.x * this.data.smallScale,
        elScale.y * this.data.scaleSetting.y * this.data.smallScale,
        elScale.z * this.data.scaleSetting.z * this.data.smallScale
      );
      if (this.data.ratio <= 1) {
        this.data.frameEl.setAttribute("scale", {
          x: this.data.maxScale.x,
          y: this.data.maxScale.y * this.data.ratio,
          z: this.data.maxScale.z
        });
      } else {
        this.data.frameEl.setAttribute("scale", {
          x: this.data.maxScale.x / this.data.ratio,
          y: this.data.maxScale.y,
          z: this.data.maxScale.z
        });
      }

      //Update visibility based on defaultEnabled
      if (this.data.isSmall && this.data.defaultEnabled) {
        //make big
        this.data.isSmall = false;
        this.data.smallScale = 1;
      } else if (!this.data.isSmall && !this.data.defaultEnabled) {
        //make small
        this.data.isSmall = true;
        this.data.smallScale = 0.001;
      }
    } else {
      let elScale = this.el.object3D.scale;
      if (
        this.data.frameEl.object3D.scale.x === elScale.x * this.data.scaleSetting.x * 0.001 &&
        this.data.smallScale !== 0.001
      ) {
        this.data.smallScale = 0.001;
      } else if (
        this.data.frameEl.object3D.scale.x === elScale.x * this.data.scaleSetting.x &&
        this.data.smallScale !== 1
      ) {
        this.data.smallScale = 1;
      }
    }

    //Remove frame button if frameEl detached
    if (!this.data.frameEl.attached) {
      let buttonEl = this.el.querySelector("[toggle-frame-button]");
      if (!buttonEl) return;
      buttonEl.object3D.visible = false;
      buttonEl.matrixAutoUpdate = true;
    }
  }
});

AFRAME.registerComponent("framedEl-listener", {
  schema: {
    framedEl: { default: {} }
  },

  init() {
    this.time = 0;
  },

  tick(t, dt) {
    this.time += dt;
    if (!this.attrValue.framedEl.attached) {
      AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.uninspect();
      NAF.utils.takeOwnership(this.el);
      this.el.parentNode.removeChild(this.el);
    }
  }
});
