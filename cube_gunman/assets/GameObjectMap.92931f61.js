import { V as Vector3, P as Plane, L as Line3, S as Sphere, B as Box3, T as Triangle, N as NearestFilter, s as sRGBEncoding, F as FrontSide, C as CustomBlending, A as AddEquation, a as SrcAlphaFactor, O as OneMinusSrcAlphaFactor, M as MeshBasicMaterial, b as LinearFilter, G as GameContext, D as DomPipe, c as Vector2, R as Raycaster, U as UserInputEventEnum, d as MathUtils, e as LinearInterpolant, W as WeaponAnimationEventEnum, f as LoopOnce, g as LoopRepeat, h as DoubleSide, i as DomEventPipe, j as PointLockEvent, k as PointLockEventEnum, l as ShaderPass, m as Texture, n as BufferGeometry, o as ShaderMaterial, p as AdditiveBlending, q as Points, r as BufferAttribute, t as Mesh, u as UniformsUtils, v as BackSide, w as BoxGeometry, x as Color } from './game.44536e15.js';

const _v1$1 = new Vector3();
const _v2$1 = new Vector3();
const _v3 = new Vector3();

const EPS = 1e-10;

class Capsule {

	constructor( start = new Vector3( 0, 0, 0 ), end = new Vector3( 0, 1, 0 ), radius = 1 ) {

		this.start = start;
		this.end = end;
		this.radius = radius;

	}

	clone() {

		return new Capsule( this.start.clone(), this.end.clone(), this.radius );

	}

	set( start, end, radius ) {

		this.start.copy( start );
		this.end.copy( end );
		this.radius = radius;

	}

	copy( capsule ) {

		this.start.copy( capsule.start );
		this.end.copy( capsule.end );
		this.radius = capsule.radius;

	}

	getCenter( target ) {

		return target.copy( this.end ).add( this.start ).multiplyScalar( 0.5 );

	}

	translate( v ) {

		this.start.add( v );
		this.end.add( v );

	}

	checkAABBAxis( p1x, p1y, p2x, p2y, minx, maxx, miny, maxy, radius ) {

		return (
			( minx - p1x < radius || minx - p2x < radius ) &&
			( p1x - maxx < radius || p2x - maxx < radius ) &&
			( miny - p1y < radius || miny - p2y < radius ) &&
			( p1y - maxy < radius || p2y - maxy < radius )
		);

	}

	intersectsBox( box ) {

		return (
			this.checkAABBAxis(
				this.start.x, this.start.y, this.end.x, this.end.y,
				box.min.x, box.max.x, box.min.y, box.max.y,
				this.radius ) &&
			this.checkAABBAxis(
				this.start.x, this.start.z, this.end.x, this.end.z,
				box.min.x, box.max.x, box.min.z, box.max.z,
				this.radius ) &&
			this.checkAABBAxis(
				this.start.y, this.start.z, this.end.y, this.end.z,
				box.min.y, box.max.y, box.min.z, box.max.z,
				this.radius )
		);

	}

	lineLineMinimumPoints( line1, line2 ) {

		const r = _v1$1.copy( line1.end ).sub( line1.start );
		const s = _v2$1.copy( line2.end ).sub( line2.start );
		const w = _v3.copy( line2.start ).sub( line1.start );

		const a = r.dot( s ),
			b = r.dot( r ),
			c = s.dot( s ),
			d = s.dot( w ),
			e = r.dot( w );

		let t1, t2;
		const divisor = b * c - a * a;

		if ( Math.abs( divisor ) < EPS ) {

			const d1 = - d / c;
			const d2 = ( a - d ) / c;

			if ( Math.abs( d1 - 0.5 ) < Math.abs( d2 - 0.5 ) ) {

				t1 = 0;
				t2 = d1;

			} else {

				t1 = 1;
				t2 = d2;

			}

		} else {

			t1 = ( d * a + e * c ) / divisor;
			t2 = ( t1 * a - d ) / c;

		}

		t2 = Math.max( 0, Math.min( 1, t2 ) );
		t1 = Math.max( 0, Math.min( 1, t1 ) );

		const point1 = r.multiplyScalar( t1 ).add( line1.start );
		const point2 = s.multiplyScalar( t2 ).add( line2.start );

		return [ point1, point2 ];

	}

}

const _v1 = new Vector3();
const _v2 = new Vector3();
const _plane = new Plane();
const _line1 = new Line3();
const _line2 = new Line3();
const _sphere = new Sphere();
const _capsule = new Capsule();

class Octree {


	constructor( box ) {

		this.triangles = [];
		this.box = box;
		this.subTrees = [];

	}

	addTriangle( triangle ) {

		if ( ! this.bounds ) this.bounds = new Box3();

		this.bounds.min.x = Math.min( this.bounds.min.x, triangle.a.x, triangle.b.x, triangle.c.x );
		this.bounds.min.y = Math.min( this.bounds.min.y, triangle.a.y, triangle.b.y, triangle.c.y );
		this.bounds.min.z = Math.min( this.bounds.min.z, triangle.a.z, triangle.b.z, triangle.c.z );
		this.bounds.max.x = Math.max( this.bounds.max.x, triangle.a.x, triangle.b.x, triangle.c.x );
		this.bounds.max.y = Math.max( this.bounds.max.y, triangle.a.y, triangle.b.y, triangle.c.y );
		this.bounds.max.z = Math.max( this.bounds.max.z, triangle.a.z, triangle.b.z, triangle.c.z );

		this.triangles.push( triangle );

		return this;

	}

	calcBox() {

		this.box = this.bounds.clone();

		// offset small amount to account for regular grid
		this.box.min.x -= 0.01;
		this.box.min.y -= 0.01;
		this.box.min.z -= 0.01;

		return this;

	}

	split( level ) {

		if ( ! this.box ) return;

		const subTrees = [];
		const halfsize = _v2.copy( this.box.max ).sub( this.box.min ).multiplyScalar( 0.5 );

		for ( let x = 0; x < 2; x ++ ) {

			for ( let y = 0; y < 2; y ++ ) {

				for ( let z = 0; z < 2; z ++ ) {

					const box = new Box3();
					const v = _v1.set( x, y, z );

					box.min.copy( this.box.min ).add( v.multiply( halfsize ) );
					box.max.copy( box.min ).add( halfsize );

					subTrees.push( new Octree( box ) );

				}

			}

		}

		let triangle;

		while ( triangle = this.triangles.pop() ) {

			for ( let i = 0; i < subTrees.length; i ++ ) {

				if ( subTrees[ i ].box.intersectsTriangle( triangle ) ) {

					subTrees[ i ].triangles.push( triangle );

				}

			}

		}

		for ( let i = 0; i < subTrees.length; i ++ ) {

			const len = subTrees[ i ].triangles.length;

			if ( len > 8 && level < 16 ) {

				subTrees[ i ].split( level + 1 );

			}

			if ( len !== 0 ) {

				this.subTrees.push( subTrees[ i ] );

			}

		}

		return this;

	}

	build() {

		this.calcBox();
		this.split( 0 );

		return this;

	}

	getRayTriangles( ray, triangles ) {

		for ( let i = 0; i < this.subTrees.length; i ++ ) {

			const subTree = this.subTrees[ i ];
			if ( ! ray.intersectsBox( subTree.box ) ) continue;

			if ( subTree.triangles.length > 0 ) {

				for ( let j = 0; j < subTree.triangles.length; j ++ ) {

					if ( triangles.indexOf( subTree.triangles[ j ] ) === - 1 ) triangles.push( subTree.triangles[ j ] );

				}

			} else {

				subTree.getRayTriangles( ray, triangles );

			}

		}

		return triangles;

	}

	triangleCapsuleIntersect( capsule, triangle ) {

		triangle.getPlane( _plane );

		const d1 = _plane.distanceToPoint( capsule.start ) - capsule.radius;
		const d2 = _plane.distanceToPoint( capsule.end ) - capsule.radius;

		if ( ( d1 > 0 && d2 > 0 ) || ( d1 < - capsule.radius && d2 < - capsule.radius ) ) {

			return false;

		}

		const delta = Math.abs( d1 / ( Math.abs( d1 ) + Math.abs( d2 ) ) );
		const intersectPoint = _v1.copy( capsule.start ).lerp( capsule.end, delta );

		if ( triangle.containsPoint( intersectPoint ) ) {

			return { normal: _plane.normal.clone(), point: intersectPoint.clone(), depth: Math.abs( Math.min( d1, d2 ) ) };

		}

		const r2 = capsule.radius * capsule.radius;

		const line1 = _line1.set( capsule.start, capsule.end );

		const lines = [
			[ triangle.a, triangle.b ],
			[ triangle.b, triangle.c ],
			[ triangle.c, triangle.a ]
		];

		for ( let i = 0; i < lines.length; i ++ ) {

			const line2 = _line2.set( lines[ i ][ 0 ], lines[ i ][ 1 ] );

			const [ point1, point2 ] = capsule.lineLineMinimumPoints( line1, line2 );

			if ( point1.distanceToSquared( point2 ) < r2 ) {

				return { normal: point1.clone().sub( point2 ).normalize(), point: point2.clone(), depth: capsule.radius - point1.distanceTo( point2 ) };

			}

		}

		return false;

	}

	triangleSphereIntersect( sphere, triangle ) {

		triangle.getPlane( _plane );

		if ( ! sphere.intersectsPlane( _plane ) ) return false;

		const depth = Math.abs( _plane.distanceToSphere( sphere ) );
		const r2 = sphere.radius * sphere.radius - depth * depth;

		const plainPoint = _plane.projectPoint( sphere.center, _v1 );

		if ( triangle.containsPoint( sphere.center ) ) {

			return { normal: _plane.normal.clone(), point: plainPoint.clone(), depth: Math.abs( _plane.distanceToSphere( sphere ) ) };

		}

		const lines = [
			[ triangle.a, triangle.b ],
			[ triangle.b, triangle.c ],
			[ triangle.c, triangle.a ]
		];

		for ( let i = 0; i < lines.length; i ++ ) {

			_line1.set( lines[ i ][ 0 ], lines[ i ][ 1 ] );
			_line1.closestPointToPoint( plainPoint, true, _v2 );

			const d = _v2.distanceToSquared( sphere.center );

			if ( d < r2 ) {

				return { normal: sphere.center.clone().sub( _v2 ).normalize(), point: _v2.clone(), depth: sphere.radius - Math.sqrt( d ) };

			}

		}

		return false;

	}

	getSphereTriangles( sphere, triangles ) {

		for ( let i = 0; i < this.subTrees.length; i ++ ) {

			const subTree = this.subTrees[ i ];

			if ( ! sphere.intersectsBox( subTree.box ) ) continue;

			if ( subTree.triangles.length > 0 ) {

				for ( let j = 0; j < subTree.triangles.length; j ++ ) {

					if ( triangles.indexOf( subTree.triangles[ j ] ) === - 1 ) triangles.push( subTree.triangles[ j ] );

				}

			} else {

				subTree.getSphereTriangles( sphere, triangles );

			}

		}

	}

	getCapsuleTriangles( capsule, triangles ) {

		for ( let i = 0; i < this.subTrees.length; i ++ ) {

			const subTree = this.subTrees[ i ];

			if ( ! capsule.intersectsBox( subTree.box ) ) continue;

			if ( subTree.triangles.length > 0 ) {

				for ( let j = 0; j < subTree.triangles.length; j ++ ) {

					if ( triangles.indexOf( subTree.triangles[ j ] ) === - 1 ) triangles.push( subTree.triangles[ j ] );

				}

			} else {

				subTree.getCapsuleTriangles( capsule, triangles );

			}

		}

	}

	sphereIntersect( sphere ) {

		_sphere.copy( sphere );

		const triangles = [];
		let result, hit = false;

		this.getSphereTriangles( sphere, triangles );

		for ( let i = 0; i < triangles.length; i ++ ) {

			if ( result = this.triangleSphereIntersect( _sphere, triangles[ i ] ) ) {

				hit = true;

				_sphere.center.add( result.normal.multiplyScalar( result.depth ) );

			}

		}

		if ( hit ) {

			const collisionVector = _sphere.center.clone().sub( sphere.center );
			const depth = collisionVector.length();

			return { normal: collisionVector.normalize(), depth: depth };

		}

		return false;

	}

	capsuleIntersect( capsule ) {

		_capsule.copy( capsule );

		const triangles = [];
		let result, hit = false;

		this.getCapsuleTriangles( _capsule, triangles );

		for ( let i = 0; i < triangles.length; i ++ ) {

			if ( result = this.triangleCapsuleIntersect( _capsule, triangles[ i ] ) ) {

				hit = true;

				_capsule.translate( result.normal.multiplyScalar( result.depth ) );

			}

		}

		if ( hit ) {

			const collisionVector = _capsule.getCenter( new Vector3() ).sub( capsule.getCenter( _v1 ) );
			const depth = collisionVector.length();

			return { normal: collisionVector.normalize(), depth: depth };

		}

		return false;

	}

	rayIntersect( ray ) {

		if ( ray.direction.length() === 0 ) return;

		const triangles = [];
		let triangle, position, distance = 1e100;

		this.getRayTriangles( ray, triangles );

		for ( let i = 0; i < triangles.length; i ++ ) {

			const result = ray.intersectTriangle( triangles[ i ].a, triangles[ i ].b, triangles[ i ].c, true, _v1 );

			if ( result ) {

				const newdistance = result.sub( ray.origin ).length();

				if ( distance > newdistance ) {

					position = result.clone().add( ray.origin );
					distance = newdistance;
					triangle = triangles[ i ];

				}

			}

		}

		return distance < 1e100 ? { distance: distance, triangle: triangle, position: position } : false;

	}

	fromGraphNode( group ) {

		group.updateWorldMatrix( true, true );

		group.traverse( ( obj ) => {

			if ( obj.isMesh === true ) {

				let geometry, isTemp = false;

				if ( obj.geometry.index !== null ) {

					isTemp = true;
					geometry = obj.geometry.toNonIndexed();

				} else {

					geometry = obj.geometry;

				}

				const positionAttribute = geometry.getAttribute( 'position' );

				for ( let i = 0; i < positionAttribute.count; i += 3 ) {

					const v1 = new Vector3().fromBufferAttribute( positionAttribute, i );
					const v2 = new Vector3().fromBufferAttribute( positionAttribute, i + 1 );
					const v3 = new Vector3().fromBufferAttribute( positionAttribute, i + 2 );

					v1.applyMatrix4( obj.matrixWorld );
					v2.applyMatrix4( obj.matrixWorld );
					v3.applyMatrix4( obj.matrixWorld );

					this.addTriangle( new Triangle( v1, v2, v3 ) );

				}

				if ( isTemp ) {

					geometry.dispose();

				}

			}

		} );

		this.build();

		return this;

	}

}

const dealWithBakedTexture = (mesh, texture) => {
  texture.encoding = sRGBEncoding;
  texture.flipY = false;
  const mtl = new MeshBasicMaterial({ map: texture });
  mesh.material = mtl;
};
const anisotropy8x = (mesh) => {
  mesh.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      const _material = child.material;
      if (_material.map)
        _material.map.anisotropy = 8;
    }
  });
};
const dealWithRoleTexture = (texture) => {
  texture.generateMipmaps = false;
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.encoding = sRGBEncoding;
  texture.flipY = false;
};
const dealWithRoleMaterial = (material) => {
  material.side = FrontSide;
  material.alphaTest = 1;
  material.blending = CustomBlending;
  material.blendEquation = AddEquation;
  material.blendSrc = SrcAlphaFactor;
  material.blendDst = OneMinusSrcAlphaFactor;
};
const dealWithWeaponTexture = (texture) => {
  texture.generateMipmaps = true;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.encoding = sRGBEncoding;
  texture.flipY = false;
};

var GameObjectMaterialEnum = /* @__PURE__ */ ((GameObjectMaterialEnum2) => {
  GameObjectMaterialEnum2[GameObjectMaterialEnum2["PlayerHead"] = 0] = "PlayerHead";
  GameObjectMaterialEnum2[GameObjectMaterialEnum2["PlayerChest"] = 1] = "PlayerChest";
  GameObjectMaterialEnum2[GameObjectMaterialEnum2["PlayerUpperLimb"] = 2] = "PlayerUpperLimb";
  GameObjectMaterialEnum2[GameObjectMaterialEnum2["PlayerLowerLimb"] = 3] = "PlayerLowerLimb";
  GameObjectMaterialEnum2[GameObjectMaterialEnum2["PlayerBelly"] = 4] = "PlayerBelly";
  GameObjectMaterialEnum2[GameObjectMaterialEnum2["GrassGround"] = 5] = "GrassGround";
  return GameObjectMaterialEnum2;
})(GameObjectMaterialEnum || {});

class LevelMirage {
  init() {
    const boardScene = GameContext.Scenes.Level;
    const octTree = new Octree();
    GameContext.Physical.WorldOCTree = octTree;
    const gltf = GameContext.GameResources.resourceMap.get("Map");
    const boardMesh = gltf.scene.children[0];
    const physicsMesh = gltf.scene;
    octTree.fromGraphNode(physicsMesh);
    const bakedTexture = GameContext.GameResources.textureLoader.load("/levels/t.mirage.baked.75.jpg");
    dealWithBakedTexture(boardMesh, bakedTexture);
    anisotropy8x(boardMesh);
    boardMesh.userData["GameObjectMaterialEnum"] = GameObjectMaterialEnum.GrassGround;
    boardScene.add(boardMesh);
  }
}

var WeaponClassificationEnum = /* @__PURE__ */ ((WeaponClassificationEnum2) => {
  WeaponClassificationEnum2[WeaponClassificationEnum2["Rifle"] = 0] = "Rifle";
  WeaponClassificationEnum2[WeaponClassificationEnum2["SniperRifle"] = 1] = "SniperRifle";
  WeaponClassificationEnum2[WeaponClassificationEnum2["Pistol"] = 2] = "Pistol";
  WeaponClassificationEnum2[WeaponClassificationEnum2["Malee"] = 3] = "Malee";
  WeaponClassificationEnum2[WeaponClassificationEnum2["SMG"] = 4] = "SMG";
  WeaponClassificationEnum2[WeaponClassificationEnum2["Shotgun"] = 5] = "Shotgun";
  WeaponClassificationEnum2[WeaponClassificationEnum2["Machinegun"] = 6] = "Machinegun";
  return WeaponClassificationEnum2;
})(WeaponClassificationEnum || {});

const LayerEventPipe = new DomPipe();
const BulletFallenPointEvent = new CustomEvent("bullet fallenpoint", {
  detail: {
    fallenPoint: new Vector3(),
    fallenNormal: new Vector3(),
    cameraPosition: new Vector3(),
    recoiledScreenCoord: new Vector2()
  }
});
const ShotOutWeaponFireEvent = new CustomEvent("shoutoutweapon fired", {});

const UserInputEventPipe = new DomPipe();
const UserInputEvent = new CustomEvent("input", {
  detail: { enum: void 0 }
});

const GameLogicEventPipe = new DomPipe();
const WeaponFireEvent = new CustomEvent("weapon fired", {
  detail: {
    bPointRecoiledScreenCoord: void 0,
    weaponInstance: void 0
  }
});
const WeaponEquipEvent = new CustomEvent(
  "waepon equiped",
  {
    detail: { weaponInstance: void 0 }
  }
);

class WeaponSystem {
  camera = GameContext.Cameras.PlayerCamera;
  scene = GameContext.Scenes.Level;
  triggleDown = false;
  raycaster = new Raycaster();
  _objectsIntersectedArray = [];
  static weaponSystemInstance;
  constructor() {
    UserInputEventPipe.addEventListener(UserInputEvent.type, (e) => {
      switch (e.detail.enum) {
        case UserInputEventEnum.BUTTON_TRIGGLE_DOWN:
          this.triggleDown = true;
          break;
        case UserInputEventEnum.BUTTON_TRIGGLE_UP:
          this.triggleDown = false;
          break;
      }
    });
    this.dealWithWeaponOpenFire();
  }
  static getInstance() {
    if (!this.weaponSystemInstance)
      this.weaponSystemInstance = new WeaponSystem();
    return this.weaponSystemInstance;
  }
  dealWithWeaponOpenFire() {
    GameLogicEventPipe.addEventListener(WeaponFireEvent.type, (e) => {
      if (e.detail.weaponInstance && e.detail.weaponInstance.weaponClassificationEnum !== WeaponClassificationEnum.Malee)
        LayerEventPipe.dispatchEvent(ShotOutWeaponFireEvent);
      this._objectsIntersectedArray.length = 0;
      let ifGenerated = false;
      const bpPointScreenCoord = e.detail.bPointRecoiledScreenCoord;
      this.raycaster.setFromCamera(bpPointScreenCoord, this.camera);
      this.raycaster.params.Mesh.threshold = 1;
      this.raycaster.intersectObjects(this.scene.children, true, this._objectsIntersectedArray);
      if (this._objectsIntersectedArray.length > 0) {
        for (let i = 0; i < this._objectsIntersectedArray.length; i++) {
          if (ifGenerated)
            return;
          const point = this._objectsIntersectedArray[i].point;
          const gameObjectMaterial = this._objectsIntersectedArray[i].object.userData["GameObjectMaterialEnum"];
          if (gameObjectMaterial === void 0)
            return;
          switch (gameObjectMaterial) {
            case GameObjectMaterialEnum.PlayerHead | GameObjectMaterialEnum.PlayerBelly | GameObjectMaterialEnum.PlayerChest | GameObjectMaterialEnum.PlayerUpperLimb | GameObjectMaterialEnum.PlayerLowerLimb:
              ifGenerated = true;
              break;
            case GameObjectMaterialEnum.GrassGround:
              if (e.detail.weaponInstance && e.detail.weaponInstance.weaponClassificationEnum === WeaponClassificationEnum.Malee)
                break;
              const normal = this._objectsIntersectedArray[i].face.normal;
              BulletFallenPointEvent.detail.fallenPoint.copy(point);
              BulletFallenPointEvent.detail.fallenNormal.copy(normal);
              BulletFallenPointEvent.detail.cameraPosition.copy(this.camera.position);
              BulletFallenPointEvent.detail.recoiledScreenCoord.copy(bpPointScreenCoord);
              LayerEventPipe.dispatchEvent(BulletFallenPointEvent);
              ifGenerated = true;
              break;
          }
        }
      }
    });
  }
}

const AnimationEventPipe = new DomPipe();
const WeaponAnimationEvent = new CustomEvent("weapon animation", {
  detail: {
    enum: void 0,
    weaponInstance: void 0
  }
});

let startRecover$1 = true;
let startRecoverLine$1 = 0;
let cameraRotateTotalX = 0;
let cameraRotateTotalY = 0;
let cameraRotationBasicTotal$1 = 0;
let recovercameraRotateTotalX$1 = 0;
let recovercameraRotateTotalY = 0;
const bPointRecoiledScreenCoord$2 = new Vector2();
class AutomaticWeapon {
  weaponSystem = WeaponSystem.getInstance();
  animationMixer;
  weaponSkinnedMesh;
  camera = GameContext.Cameras.PlayerCamera;
  scene = GameContext.Scenes.Handmodel;
  lastFireTime = 0;
  bulletLeftMagzine;
  bulletLeftTotal;
  active = false;
  weaponUUID = MathUtils.generateUUID();
  weaponClassificationEnum;
  weaponName;
  weaponNameSuffix;
  magazineSize;
  recoverTime;
  reloadTime;
  speed;
  killaward;
  damage;
  fireRate;
  recoilControl;
  accurateRange;
  armorPenetration;
  recoverLine = 0;
  bulletPosition;
  bulletPositionDelta;
  bulletPositionInterpolant;
  bulletPositionDeltaInterpolant;
  equipAnim;
  reloadAnim;
  fireAnim;
  holdAnim;
  viewAnim;
  constructor(bulletPosition, bulletPositionDelta) {
    this.bulletPosition = bulletPosition;
    this.bulletPositionDelta = bulletPositionDelta;
  }
  init() {
    const positions = [];
    for (let i = 0; i < this.magazineSize; i++)
      positions[i] = i * this.fireRate;
    this.bulletPositionInterpolant = new LinearInterpolant(
      new Float32Array(positions),
      new Float32Array(this.bulletPosition),
      2,
      new Float32Array(2)
    );
    this.bulletPositionDeltaInterpolant = new LinearInterpolant(
      new Float32Array(positions),
      new Float32Array(this.bulletPositionDelta),
      2,
      new Float32Array(2)
    );
    UserInputEventPipe.addEventListener(UserInputEvent.type, (e) => {
      if (!this.active)
        return;
      switch (e.detail.enum) {
        case UserInputEventEnum.BUTTON_RELOAD:
          if (this.magazineSize <= this.bulletLeftMagzine)
            return;
          this.active = false;
          WeaponAnimationEvent.detail.enum = WeaponAnimationEventEnum.RELOAD;
          WeaponAnimationEvent.detail.weaponInstance = this;
          AnimationEventPipe.dispatchEvent(WeaponAnimationEvent);
          break;
        case UserInputEventEnum.BUTTON_TRIGGLE_UP:
          if (this.bulletLeftMagzine > 0)
            return;
          this.active = false;
          WeaponAnimationEvent.detail.enum = WeaponAnimationEventEnum.RELOAD;
          WeaponAnimationEvent.detail.weaponInstance = this;
          AnimationEventPipe.dispatchEvent(WeaponAnimationEvent);
          break;
      }
    });
  }
  initAnimation() {
    const equipAnimName = `${this.weaponName}_equip`;
    const reloadAnimName = `${this.weaponName}_reload`;
    const fireAnimName = `${this.weaponName}_fire`;
    const holdAnimName = `${this.weaponName}_hold`;
    const viewAnimName = `${this.weaponName}_view`;
    this.weaponSkinnedMesh = GameContext.GameResources.resourceMap.get(`${this.weaponName}_1`);
    this.animationMixer = GameContext.GameResources.resourceMap.get("AnimationMixer");
    this.scene.add(this.weaponSkinnedMesh);
    this.equipAnim = GameContext.GameResources.resourceMap.get(equipAnimName);
    if (this.equipAnim)
      this.equipAnim.loop = LoopOnce;
    this.reloadAnim = GameContext.GameResources.resourceMap.get(reloadAnimName);
    if (this.reloadAnim)
      this.reloadAnim.loop = LoopOnce;
    this.fireAnim = GameContext.GameResources.resourceMap.get(fireAnimName);
    if (this.fireAnim)
      this.fireAnim.loop = LoopOnce;
    this.holdAnim = GameContext.GameResources.resourceMap.get(holdAnimName);
    if (this.holdAnim)
      this.holdAnim.loop = LoopRepeat;
    this.viewAnim = GameContext.GameResources.resourceMap.get(viewAnimName);
    if (this.viewAnim)
      this.viewAnim.loop = LoopOnce;
    this.animationMixer.addEventListener("finished", (e) => {
      if (e.type === "finished") {
        switch (e.action._clip.name) {
          case equipAnimName:
            this.active = true;
            break;
          case reloadAnimName:
            this.bulletLeftMagzine = this.magazineSize;
            this.active = true;
            break;
        }
      }
    });
    AnimationEventPipe.addEventListener(WeaponAnimationEvent.type, (e) => {
      if (e.detail.weaponInstance !== this)
        return;
      switch (e.detail.enum) {
        case WeaponAnimationEventEnum.RELIEVE_EQUIP:
          this.weaponSkinnedMesh.visible = false;
          this.active = false;
          this.animationMixer.stopAllAction();
          if (this.holdAnim)
            this.holdAnim.reset();
          if (this.reloadAnim)
            this.reloadAnim.reset();
          if (this.equipAnim)
            this.equipAnim.reset();
          if (this.fireAnim)
            this.fireAnim.reset();
          if (this.viewAnim)
            this.viewAnim.reset();
          break;
        case WeaponAnimationEventEnum.EQUIP:
          this.weaponSkinnedMesh.visible = true;
          this.holdAnim.play();
          this.equipAnim.weight = 49;
          this.equipAnim.reset();
          this.equipAnim.play();
          this.active = false;
          break;
        case WeaponAnimationEventEnum.FIRE:
          this.fireAnim.weight = 49;
          this.fireAnim.reset();
          this.fireAnim.play();
          break;
        case WeaponAnimationEventEnum.RELOAD:
          this.reloadAnim.weight = 49;
          this.reloadAnim.reset();
          this.reloadAnim.play();
          this.active = false;
          break;
      }
    });
  }
  fire() {
    if (!startRecover$1) {
      cameraRotateTotalX = recovercameraRotateTotalX$1;
      cameraRotateTotalY = recovercameraRotateTotalY;
    }
    const floatTypedArray0 = this.bulletPositionInterpolant.evaluate(this.recoverLine);
    bPointRecoiledScreenCoord$2.set(floatTypedArray0[0], floatTypedArray0[1]);
    const deltaRecoiledX = 1 / this.accurateRange * (Math.random() - 0.5);
    const deltaRecoiledY = 1 / this.accurateRange * Math.random();
    bPointRecoiledScreenCoord$2.x += deltaRecoiledX;
    bPointRecoiledScreenCoord$2.y += deltaRecoiledY;
    const basicPitch = 0.02 * Math.PI * (1 / this.recoilControl);
    this.camera.rotation.x += basicPitch;
    cameraRotationBasicTotal$1 += basicPitch;
    const floatTypedArray1 = this.bulletPositionDeltaInterpolant.evaluate(this.recoverLine);
    const deltaYaw = -floatTypedArray1[0] * Math.PI * (1 / this.recoilControl);
    const deltaPitch = floatTypedArray1[1] * Math.PI * (1 / this.recoilControl);
    this.camera.rotation.x += deltaPitch;
    this.camera.rotation.y += deltaYaw;
    cameraRotateTotalX += deltaPitch;
    cameraRotateTotalY += deltaYaw;
    this.recoverLine += this.fireRate;
    this.bulletLeftMagzine -= 1;
    startRecover$1 = true;
    WeaponAnimationEvent.detail.enum = WeaponAnimationEventEnum.FIRE;
    WeaponAnimationEvent.detail.weaponInstance = this;
    AnimationEventPipe.dispatchEvent(WeaponAnimationEvent);
    WeaponFireEvent.detail.bPointRecoiledScreenCoord = bPointRecoiledScreenCoord$2;
    WeaponFireEvent.detail.weaponInstance = this;
    GameLogicEventPipe.dispatchEvent(WeaponFireEvent);
    console.log(`fire: ${this.bulletLeftMagzine} / ${this.magazineSize}`);
  }
  recover(deltaTime, elapsedTime) {
    if (cameraRotationBasicTotal$1 > 0) {
      if (cameraRotationBasicTotal$1 - 1e-3 > 0) {
        this.camera.rotation.x -= 1e-3;
        cameraRotationBasicTotal$1 -= 1e-3;
      } else {
        this.camera.rotation.x -= cameraRotationBasicTotal$1;
        cameraRotationBasicTotal$1 = 0;
      }
    }
    const triggleDown = this.weaponSystem.triggleDown;
    let deltaRecoverScale = deltaTime / this.recoverTime;
    if (!triggleDown || this.bulletLeftMagzine <= 0 || !this.active) {
      if (startRecover$1) {
        recovercameraRotateTotalX$1 = cameraRotateTotalX;
        recovercameraRotateTotalY = cameraRotateTotalY;
        startRecoverLine$1 = this.recoverLine;
      }
      if (this.recoverLine != 0) {
        const recoverLineBeforeMinus = this.recoverLine;
        if (this.recoverLine - deltaRecoverScale * startRecoverLine$1 > 0)
          this.recoverLine -= deltaRecoverScale * startRecoverLine$1;
        else {
          deltaRecoverScale = this.recoverLine / startRecoverLine$1;
          this.recoverLine = 0;
          cameraRotateTotalX = 0;
          cameraRotateTotalY = 0;
          recovercameraRotateTotalX$1 = 0;
          recovercameraRotateTotalY = 0;
        }
        const minusScale = recoverLineBeforeMinus - this.recoverLine;
        const recoverLineScale = minusScale / startRecoverLine$1;
        const deltaYaw = cameraRotateTotalY * recoverLineScale;
        const deltaPitch = cameraRotateTotalX * recoverLineScale;
        this.camera.rotation.x -= deltaPitch;
        this.camera.rotation.y -= deltaYaw;
        recovercameraRotateTotalX$1 -= deltaPitch;
        recovercameraRotateTotalY -= deltaYaw;
        startRecover$1 = false;
      }
    }
  }
  callEveryFrame(deltaTime, elapsedTime) {
    if (!GameContext.PointLock.isLocked)
      return;
    if (!this.active)
      return;
    if (this.bulletLeftMagzine <= 0)
      return;
    if (!this.weaponSystem.triggleDown)
      return;
    if (performance.now() - this.lastFireTime >= this.fireRate * 1e3) {
      this.lastFireTime = performance.now();
      this.fire();
    }
  }
}

class AutomaticWeaponBPointsUtil {
  static bulletPositionArray2ScreenCoordArray = function(bulletPositionArray, bulletNumber, rateX, rateY, recoilForce) {
    const bulletDeltaArray = [];
    let baseX = bulletPositionArray[0];
    let baseY = bulletPositionArray[1];
    const pmMX = 960;
    const pmMy = 540;
    for (let i = 0; i < bulletNumber; i++) {
      let i2_x = bulletPositionArray[2 * i] - baseX;
      let i2_y = bulletPositionArray[2 * i + 1] - baseY;
      i2_x = i2_x * rateX * recoilForce;
      i2_y = i2_y * rateY * recoilForce;
      bulletDeltaArray[2 * i] = pmMX + i2_x;
      bulletDeltaArray[2 * i + 1] = pmMy - i2_y;
    }
    for (let i = 0; i < bulletNumber; i++) {
      bulletDeltaArray[2 * i] = (bulletDeltaArray[2 * i] - 960) / 960;
      bulletDeltaArray[2 * i + 1] = (bulletDeltaArray[2 * i + 1] - 540) / 540;
    }
    return bulletDeltaArray;
  };
  static bulletDeltaPositionArray2ScreenCoordArray = function(bulletPositionArray, bulletNumber, rateX, rateY, recoilForce) {
    const bulletDeltaArray = [];
    let baseX = bulletPositionArray[0];
    let baseY = bulletPositionArray[1];
    const pmMX = 960;
    const pmMy = 540;
    for (let i = 0; i < bulletNumber; i++) {
      let i2_x = bulletPositionArray[2 * i] - baseX;
      let i2_y = bulletPositionArray[2 * i + 1] - baseY;
      i2_x = i2_x * rateX * recoilForce;
      i2_y = i2_y * rateY * recoilForce;
      bulletDeltaArray[2 * i] = pmMX + i2_x;
      bulletDeltaArray[2 * i + 1] = pmMy - i2_y;
    }
    for (let i = 0; i < bulletNumber; i++) {
      bulletDeltaArray[2 * i] = (bulletDeltaArray[2 * i] - 960) / 960;
      bulletDeltaArray[2 * i + 1] = (bulletDeltaArray[2 * i + 1] - 540) / 540;
    }
    let baseXResolved = bulletDeltaArray[0];
    let baseYResolved = bulletDeltaArray[1];
    for (let i = 0; i < bulletNumber; i++) {
      let i2_x = bulletDeltaArray[2 * i];
      let i2_y = bulletDeltaArray[2 * i + 1];
      bulletDeltaArray[2 * i] = bulletDeltaArray[2 * i] - baseXResolved;
      bulletDeltaArray[2 * i + 1] = bulletDeltaArray[2 * i + 1] - baseYResolved;
      baseXResolved = i2_x;
      baseYResolved = i2_y;
    }
    return bulletDeltaArray;
  };
}

const ak47BulletPositionArray = [
  222,
  602,
  230,
  585,
  222,
  540,
  228,
  472,
  231,
  398,
  200,
  320,
  180,
  255,
  150,
  208,
  190,
  173,
  290,
  183,
  343,
  177,
  312,
  150,
  350,
  135,
  412,
  158,
  420,
  144,
  323,
  141,
  277,
  124,
  244,
  100,
  179,
  102,
  100,
  124,
  149,
  130,
  134,
  123,
  149,
  100,
  170,
  92,
  125,
  100,
  110,
  87,
  160,
  88,
  237,
  95,
  346,
  147,
  381,
  146
];
const bulletPosition = AutomaticWeaponBPointsUtil.bulletPositionArray2ScreenCoordArray(ak47BulletPositionArray, 30, 0.2, 0.15, 1.4);
const bulletPositionDelta = AutomaticWeaponBPointsUtil.bulletDeltaPositionArray2ScreenCoordArray(ak47BulletPositionArray, 30, 0.2, 0.15, 1);
class AK47 extends AutomaticWeapon {
  muzzlePosition = new Vector3(0.921, 1.057, 0.491);
  chamberPosition = new Vector3(-0.276, 1.086, 0.565);
  constructor() {
    super(bulletPosition, bulletPositionDelta);
    const skinnedMesh = GameContext.GameResources.resourceMap.get("AK47_1");
    const texture = GameContext.GameResources.textureLoader.load("/weapons/weapon.AK47.jpg");
    dealWithWeaponTexture(texture);
    const material = new MeshBasicMaterial({ map: texture, side: DoubleSide });
    skinnedMesh.material = material;
    this.weaponClassificationEnum = WeaponClassificationEnum.Rifle;
    this.weaponName = "AK47";
    this.magazineSize = 30;
    this.fireRate = 60 / 600;
    this.recoverTime = 0.368;
    this.reloadTime = 2;
    this.recoilControl = 4;
    this.accurateRange = 120;
    this.bulletLeftMagzine = this.magazineSize;
    this.bulletLeftTotal = 90;
    this.init();
    this.initAnimation();
  }
}

const bPointRecoiledScreenCoord$1 = new Vector2();
let startRecover = true;
let startRecoverLine = 0;
let cameraRotationBasicTotal = 0;
let recovercameraRotateTotalX = 0;
class SemiAutomaticWeapon {
  animationMixer;
  weaponSkinnedMesh;
  camera = GameContext.Cameras.PlayerCamera;
  scene = GameContext.Scenes.Handmodel;
  lastFireTime = 0;
  bulletLeftMagzine;
  bulletLeftTotal;
  active = false;
  weaponUUID = MathUtils.generateUUID();
  weaponClassificationEnum;
  weaponName;
  weaponNameSuffix;
  magazineSize;
  recoverTime;
  reloadTime;
  speed;
  killaward;
  damage;
  fireRate;
  recoilControl;
  accurateRange;
  armorPenetration;
  recoverLine = 0;
  equipAnim;
  reloadAnim;
  fireAnim;
  holdAnim;
  viewAnim;
  init() {
    UserInputEventPipe.addEventListener(UserInputEvent.type, (e) => {
      if (!this.active)
        return;
      switch (e.detail.enum) {
        case UserInputEventEnum.BUTTON_RELOAD:
          if (!this.active)
            return;
          if (this.magazineSize <= this.bulletLeftMagzine)
            return;
          this.active = false;
          WeaponAnimationEvent.detail.enum = WeaponAnimationEventEnum.RELOAD;
          WeaponAnimationEvent.detail.weaponInstance = this;
          AnimationEventPipe.dispatchEvent(WeaponAnimationEvent);
          break;
        case UserInputEventEnum.BUTTON_TRIGGLE_DOWN:
          if (!GameContext.PointLock.isLocked)
            return;
          if (!this.active)
            return;
          if (this.bulletLeftMagzine <= 0) {
            this.active = false;
            WeaponAnimationEvent.detail.enum = WeaponAnimationEventEnum.RELOAD;
            WeaponAnimationEvent.detail.weaponInstance = this;
            AnimationEventPipe.dispatchEvent(WeaponAnimationEvent);
            return;
          }
          if (performance.now() - this.lastFireTime >= this.fireRate * 1e3) {
            this.lastFireTime = performance.now();
            this.fire();
          }
          break;
      }
    });
  }
  initAnimation() {
    const equipAnimName = `${this.weaponName}_equip`;
    const reloadAnimName = `${this.weaponName}_reload`;
    const fireAnimName = `${this.weaponName}_fire`;
    const holdAnimName = `${this.weaponName}_hold`;
    const viewAnimName = `${this.weaponName}_view`;
    this.weaponSkinnedMesh = GameContext.GameResources.resourceMap.get(`${this.weaponName}_1`);
    this.animationMixer = GameContext.GameResources.resourceMap.get("AnimationMixer");
    this.scene.add(this.weaponSkinnedMesh);
    this.equipAnim = GameContext.GameResources.resourceMap.get(equipAnimName);
    if (this.equipAnim)
      this.equipAnim.loop = LoopOnce;
    this.reloadAnim = GameContext.GameResources.resourceMap.get(reloadAnimName);
    if (this.reloadAnim)
      this.reloadAnim.loop = LoopOnce;
    this.fireAnim = GameContext.GameResources.resourceMap.get(fireAnimName);
    if (this.fireAnim)
      this.fireAnim.loop = LoopOnce;
    this.holdAnim = GameContext.GameResources.resourceMap.get(holdAnimName);
    if (this.holdAnim)
      this.holdAnim.loop = LoopRepeat;
    this.viewAnim = GameContext.GameResources.resourceMap.get(viewAnimName);
    if (this.viewAnim)
      this.viewAnim.loop = LoopOnce;
    this.animationMixer.addEventListener("finished", (e) => {
      if (e.type === "finished") {
        switch (e.action._clip.name) {
          case equipAnimName:
            this.active = true;
            break;
          case reloadAnimName:
            this.bulletLeftMagzine = this.magazineSize;
            this.active = true;
            break;
        }
      }
    });
    AnimationEventPipe.addEventListener(WeaponAnimationEvent.type, (e) => {
      if (e.detail.weaponInstance !== this)
        return;
      switch (e.detail.enum) {
        case WeaponAnimationEventEnum.RELIEVE_EQUIP:
          this.weaponSkinnedMesh.visible = false;
          this.active = false;
          this.animationMixer.stopAllAction();
          if (this.holdAnim)
            this.holdAnim.reset();
          if (this.reloadAnim)
            this.reloadAnim.reset();
          if (this.equipAnim)
            this.equipAnim.reset();
          if (this.fireAnim)
            this.fireAnim.reset();
          if (this.viewAnim)
            this.viewAnim.reset();
          break;
        case WeaponAnimationEventEnum.EQUIP:
          this.weaponSkinnedMesh.visible = true;
          this.holdAnim.play();
          this.equipAnim.weight = 49;
          this.equipAnim.reset();
          this.equipAnim.play();
          this.active = false;
          break;
        case WeaponAnimationEventEnum.FIRE:
          this.fireAnim.weight = 49;
          this.fireAnim.reset();
          this.fireAnim.play();
          break;
        case WeaponAnimationEventEnum.RELOAD:
          this.reloadAnim.weight = 49;
          this.reloadAnim.reset();
          this.reloadAnim.play();
          this.active = false;
          break;
      }
    });
  }
  fire() {
    if (!startRecover) {
      cameraRotationBasicTotal = recovercameraRotateTotalX;
    }
    const bpX = 1 / this.accurateRange * (Math.random() - 0.5);
    const bpY = 1 / this.accurateRange * Math.random();
    const deltaPitch = 0.05 * Math.PI * (1 / this.recoilControl);
    this.camera.rotation.x += deltaPitch;
    cameraRotationBasicTotal += deltaPitch;
    this.recoverLine += this.fireRate;
    const k = (this.recoverLine / this.fireRate - 1) * 60 / this.recoilControl;
    const deltaRecoiledX = bpX * k;
    const deltaRecoiledY = bpY * k;
    bPointRecoiledScreenCoord$1.set(deltaRecoiledX, deltaRecoiledY);
    WeaponAnimationEvent.detail.enum = WeaponAnimationEventEnum.FIRE;
    WeaponAnimationEvent.detail.weaponInstance = this;
    AnimationEventPipe.dispatchEvent(WeaponAnimationEvent);
    WeaponFireEvent.detail.bPointRecoiledScreenCoord = bPointRecoiledScreenCoord$1;
    WeaponFireEvent.detail.weaponInstance = this;
    GameLogicEventPipe.dispatchEvent(WeaponFireEvent);
    this.bulletLeftMagzine -= 1;
    startRecover = true;
  }
  recover(deltaTime, elapsedTime) {
    if (this.recoverLine != 0) {
      if (startRecover) {
        recovercameraRotateTotalX = cameraRotationBasicTotal;
        startRecoverLine = this.recoverLine;
      }
      let deltaRecoverScale = deltaTime / this.recoverTime;
      const recoverLineBeforeMinus = this.recoverLine;
      if (this.recoverLine - deltaRecoverScale * startRecoverLine > 0)
        this.recoverLine -= deltaRecoverScale * startRecoverLine;
      else {
        deltaRecoverScale = this.recoverLine / startRecoverLine;
        this.recoverLine = 0;
        cameraRotationBasicTotal = 0;
        recovercameraRotateTotalX = 0;
      }
      const minusScale = recoverLineBeforeMinus - this.recoverLine;
      const recoverLineScale = minusScale / startRecoverLine;
      const deltaPitch = cameraRotationBasicTotal * recoverLineScale;
      this.camera.rotation.x -= deltaPitch;
      recovercameraRotateTotalX -= deltaPitch;
      startRecover = false;
    }
  }
}

class USP extends SemiAutomaticWeapon {
  muzzlePosition = new Vector3(0.887, 1.079, 0.494);
  chamberPosition = new Vector3(0.109, 1.101, 0.579);
  constructor() {
    super();
    const skinnedMesh = GameContext.GameResources.resourceMap.get("USP_1");
    const texture = GameContext.GameResources.textureLoader.load("/weapons/weapon.USP.jpg");
    dealWithWeaponTexture(texture);
    const material = new MeshBasicMaterial({ map: texture, side: DoubleSide });
    skinnedMesh.material = material;
    this.weaponClassificationEnum = WeaponClassificationEnum.Pistol;
    this.weaponName = "USP";
    this.magazineSize = 12;
    this.fireRate = 0.17;
    this.recoverTime = 0.34;
    this.reloadTime = 2;
    this.recoilControl = 5;
    this.accurateRange = 120;
    this.bulletLeftMagzine = this.magazineSize;
    this.init();
    this.initAnimation();
  }
}

const bPointRecoiledScreenCoord = new Vector2();
class DaggerWeapon {
  animationMixer;
  weaponSkinnedMesh;
  scene = GameContext.Scenes.Handmodel;
  active;
  weaponClassificationEnum = WeaponClassificationEnum.Malee;
  weaponUUID = MathUtils.generateUUID();
  lastFireTime = 0;
  bulletLeftMagzine;
  bulletLeftTotal;
  weaponName;
  weaponNameSuffix;
  magazineSize;
  recoverTime;
  reloadTime;
  speed;
  killaward;
  damage;
  fireRate = 0.5;
  recoilControl;
  accurateRange;
  armorPenetration;
  constructor() {
    UserInputEventPipe.addEventListener(UserInputEvent.type, (e) => {
      if (!this.active)
        return;
      switch (e.detail.enum) {
        case UserInputEventEnum.BUTTON_TRIGGLE_DOWN:
          const performanceNow = performance.now();
          if (!GameContext.PointLock.isLocked)
            return;
          if (!this.active)
            return;
          if (performanceNow - this.lastFireTime < this.fireRate * 1e3)
            return;
          this.lastFireTime = performanceNow;
          WeaponAnimationEvent.detail.enum = WeaponAnimationEventEnum.FIRE;
          WeaponAnimationEvent.detail.weaponInstance = this;
          AnimationEventPipe.dispatchEvent(WeaponAnimationEvent);
          WeaponFireEvent.detail.bPointRecoiledScreenCoord = bPointRecoiledScreenCoord;
          WeaponFireEvent.detail.weaponInstance = this;
          GameLogicEventPipe.dispatchEvent(WeaponFireEvent);
          break;
      }
    });
  }
  equipAnim;
  fireAnim;
  holdAnim;
  viewAnim;
  initAnimation() {
    const equipAnimName = `${this.weaponName}_equip`;
    const fireAnimName = `${this.weaponName}_fire`;
    const holdAnimName = `${this.weaponName}_hold`;
    const viewAnimName = `${this.weaponName}_view`;
    this.weaponSkinnedMesh = GameContext.GameResources.resourceMap.get(`${this.weaponName}_1`);
    this.animationMixer = GameContext.GameResources.resourceMap.get("AnimationMixer");
    this.scene.add(this.weaponSkinnedMesh);
    this.equipAnim = GameContext.GameResources.resourceMap.get(equipAnimName);
    if (this.equipAnim)
      this.equipAnim.loop = LoopOnce;
    this.fireAnim = GameContext.GameResources.resourceMap.get(fireAnimName);
    if (this.fireAnim)
      this.fireAnim.loop = LoopOnce;
    this.holdAnim = GameContext.GameResources.resourceMap.get(holdAnimName);
    if (this.holdAnim)
      this.holdAnim.loop = LoopRepeat;
    this.viewAnim = GameContext.GameResources.resourceMap.get(viewAnimName);
    if (this.viewAnim)
      this.viewAnim.loop = LoopOnce;
    this.animationMixer.addEventListener("finished", (e) => {
      if (e.type === "finished") {
        switch (e.action._clip.name) {
          case equipAnimName:
            this.active = true;
            break;
        }
      }
    });
    AnimationEventPipe.addEventListener(WeaponAnimationEvent.type, (e) => {
      if (e.detail.weaponInstance !== this)
        return;
      switch (e.detail.enum) {
        case WeaponAnimationEventEnum.RELIEVE_EQUIP:
          this.weaponSkinnedMesh.visible = false;
          this.active = false;
          this.animationMixer.stopAllAction();
          if (this.holdAnim)
            this.holdAnim.reset();
          if (this.equipAnim)
            this.equipAnim.reset();
          if (this.fireAnim)
            this.fireAnim.reset();
          if (this.viewAnim)
            this.viewAnim.reset();
          break;
        case WeaponAnimationEventEnum.EQUIP:
          this.weaponSkinnedMesh.visible = true;
          this.holdAnim.play();
          this.equipAnim.weight = 49;
          this.equipAnim.reset();
          this.equipAnim.play();
          this.active = false;
          break;
        case WeaponAnimationEventEnum.FIRE:
          this.fireAnim.weight = 49;
          this.fireAnim.reset();
          this.fireAnim.play();
          break;
      }
    });
  }
}

class M9 extends DaggerWeapon {
  constructor() {
    super();
    const skinnedMesh = GameContext.GameResources.resourceMap.get("M9_1");
    const texture = GameContext.GameResources.textureLoader.load("/weapons/weapon.M9.jpg");
    dealWithWeaponTexture(texture);
    const material = new MeshBasicMaterial({ map: texture, side: DoubleSide });
    skinnedMesh.material = material;
    this.weaponName = "M9";
    this.initAnimation();
  }
}

class UserInputSystem {
  constructor() {
    this.browserEnviromentDefaultBinding();
  }
  browserEnviromentDefaultBinding() {
    document.addEventListener("mousedown", (e) => {
      if (e.button === 0) {
        UserInputEvent.detail.enum = UserInputEventEnum.BUTTON_TRIGGLE_DOWN;
        UserInputEventPipe.dispatchEvent(UserInputEvent);
      }
    });
    document.addEventListener("mouseup", (e) => {
      if (e.button === 0) {
        UserInputEvent.detail.enum = UserInputEventEnum.BUTTON_TRIGGLE_UP;
        UserInputEventPipe.dispatchEvent(UserInputEvent);
      }
    });
    document.addEventListener("keydown", (e) => {
      switch (e.code) {
        case "KeyR":
          UserInputEvent.detail.enum = UserInputEventEnum.BUTTON_RELOAD;
          UserInputEventPipe.dispatchEvent(UserInputEvent);
          break;
        case "Digit1":
          UserInputEvent.detail.enum = UserInputEventEnum.BUTTON_SWITCH_PRIMARY_WEAPON;
          UserInputEventPipe.dispatchEvent(UserInputEvent);
          break;
        case "Digit2":
          UserInputEvent.detail.enum = UserInputEventEnum.BUTTON_SWITCH_SECONDARY_WEAPON;
          UserInputEventPipe.dispatchEvent(UserInputEvent);
          break;
        case "Digit3":
          UserInputEvent.detail.enum = UserInputEventEnum.BUTTON_SWITCH_MALEE_WEAPON;
          UserInputEventPipe.dispatchEvent(UserInputEvent);
          break;
        case "KeyQ":
          UserInputEvent.detail.enum = UserInputEventEnum.BUTTON_SWITCH_LAST_WEAPON;
          UserInputEventPipe.dispatchEvent(UserInputEvent);
          break;
        case "KeyW":
          UserInputEvent.detail.enum = UserInputEventEnum.MOVE_FORWARD_DOWN;
          UserInputEventPipe.dispatchEvent(UserInputEvent);
          break;
        case "KeyA":
          UserInputEvent.detail.enum = UserInputEventEnum.MOVE_LEFT_DOWN;
          UserInputEventPipe.dispatchEvent(UserInputEvent);
          break;
        case "KeyS":
          UserInputEvent.detail.enum = UserInputEventEnum.MOVE_BACKWARD_DOWN;
          UserInputEventPipe.dispatchEvent(UserInputEvent);
          break;
        case "KeyD":
          UserInputEvent.detail.enum = UserInputEventEnum.MOVE_RIGHT_DOWN;
          UserInputEventPipe.dispatchEvent(UserInputEvent);
          break;
        case "Space":
          UserInputEvent.detail.enum = UserInputEventEnum.JUMP;
          UserInputEventPipe.dispatchEvent(UserInputEvent);
          break;
      }
    });
    document.addEventListener("keyup", (e) => {
      switch (e.code) {
        case "KeyW":
          UserInputEvent.detail.enum = UserInputEventEnum.MOVE_FORWARD_UP;
          UserInputEventPipe.dispatchEvent(UserInputEvent);
          break;
        case "KeyA":
          UserInputEvent.detail.enum = UserInputEventEnum.MOVE_LEFT_UP;
          UserInputEventPipe.dispatchEvent(UserInputEvent);
          break;
        case "KeyS":
          UserInputEvent.detail.enum = UserInputEventEnum.MOVE_BACKWARD_UP;
          UserInputEventPipe.dispatchEvent(UserInputEvent);
          break;
        case "KeyD":
          UserInputEvent.detail.enum = UserInputEventEnum.MOVE_RIGHT_UP;
          UserInputEventPipe.dispatchEvent(UserInputEvent);
          break;
      }
    });
  }
}

var InventorySlotEnum = /* @__PURE__ */ ((InventorySlotEnum2) => {
  InventorySlotEnum2[InventorySlotEnum2["Hands"] = 0] = "Hands";
  InventorySlotEnum2[InventorySlotEnum2["Primary"] = 1] = "Primary";
  InventorySlotEnum2[InventorySlotEnum2["Secondary"] = 2] = "Secondary";
  InventorySlotEnum2[InventorySlotEnum2["Malee"] = 3] = "Malee";
  return InventorySlotEnum2;
})(InventorySlotEnum || {});
function mapIventorySlotByWeaponClassficationEnum(weaponClassificationEnum) {
  switch (weaponClassificationEnum) {
    case WeaponClassificationEnum.Rifle:
      return 1 /* Primary */;
    case WeaponClassificationEnum.SniperRifle:
      return 1 /* Primary */;
    case WeaponClassificationEnum.Pistol:
      return 2 /* Secondary */;
    case WeaponClassificationEnum.Malee:
      return 3 /* Malee */;
    case WeaponClassificationEnum.SMG:
      return 1 /* Primary */;
    case WeaponClassificationEnum.Shotgun:
      return 1 /* Primary */;
    case WeaponClassificationEnum.Machinegun:
      return 1 /* Primary */;
  }
}

class InventorySystem {
  weapons = /* @__PURE__ */ new Map();
  nowEquipInventory = InventorySlotEnum.Hands;
  lastEquipInventory = InventorySlotEnum.Malee;
  init() {
    this.weapons.set(InventorySlotEnum.Hands, null);
    this.switchEquipment(InventorySlotEnum.Hands);
    UserInputEventPipe.addEventListener(UserInputEvent.type, (e) => {
      switch (e.detail.enum) {
        case UserInputEventEnum.BUTTON_SWITCH_PRIMARY_WEAPON:
          this.switchEquipment(InventorySlotEnum.Primary);
          break;
        case UserInputEventEnum.BUTTON_SWITCH_SECONDARY_WEAPON:
          this.switchEquipment(InventorySlotEnum.Secondary);
          break;
        case UserInputEventEnum.BUTTON_SWITCH_MALEE_WEAPON:
          this.switchEquipment(InventorySlotEnum.Malee);
          break;
        case UserInputEventEnum.BUTTON_SWITCH_LAST_WEAPON:
          this.switchEquipment(this.lastEquipInventory);
          break;
      }
    });
  }
  callEveryFrame(deltaTime, elapsedTime) {
    this.weapons.forEach((weapon) => {
      if (weapon && weapon.recover)
        weapon.recover(deltaTime, elapsedTime);
    });
    const nowEquipWeapon = this.weapons.get(this.nowEquipInventory);
    if (!nowEquipWeapon)
      return;
    if (nowEquipWeapon.callEveryFrame)
      nowEquipWeapon.callEveryFrame(deltaTime, elapsedTime);
  }
  switchEquipment(targetInventory) {
    const nowEquipInventory = this.nowEquipInventory;
    if (nowEquipInventory !== targetInventory) {
      WeaponAnimationEvent.detail.enum = WeaponAnimationEventEnum.RELIEVE_EQUIP;
      if (this.weapons.get(nowEquipInventory))
        WeaponAnimationEvent.detail.weaponInstance = this.weapons.get(nowEquipInventory);
      AnimationEventPipe.dispatchEvent(WeaponAnimationEvent);
      WeaponAnimationEvent.detail.enum = WeaponAnimationEventEnum.EQUIP;
      if (this.weapons.get(targetInventory))
        WeaponAnimationEvent.detail.weaponInstance = this.weapons.get(targetInventory);
      AnimationEventPipe.dispatchEvent(WeaponAnimationEvent);
      WeaponEquipEvent.detail.weaponInstance = this.weapons.get(targetInventory);
      GameLogicEventPipe.dispatchEvent(WeaponEquipEvent);
      this.nowEquipInventory = targetInventory;
      this.lastEquipInventory = nowEquipInventory;
    }
  }
  pickUpWeapon(weaponInstance) {
    const belongInventory = mapIventorySlotByWeaponClassficationEnum(weaponInstance.weaponClassificationEnum);
    if (!this.weapons.get(belongInventory))
      this.weapons.set(belongInventory, weaponInstance);
  }
}

const mouseConfig = {
  dpi: 1e3,
  mouseSensitivity: 0.5
};
const _PI_2 = Math.PI / 2;
class FPSCameraController extends EventTarget {
  domElement;
  camera;
  init() {
    this.camera = GameContext.Cameras.PlayerCamera;
    this.camera.rotation.order = "YXZ";
    this.domElement = GameContext.GameView.Container;
    const scope = this;
    DomEventPipe.addEventListener(PointLockEvent.type, function(e) {
      switch (e.detail.enum) {
        case PointLockEventEnum.MOUSEMOVE:
          const { dpi, mouseSensitivity } = mouseConfig;
          const screenTrasformX = e.detail.movementX / dpi * mouseSensitivity;
          const screenTrasformY = e.detail.movementY / dpi * mouseSensitivity;
          scope.camera.rotation.y = scope.camera.rotation.y - screenTrasformX;
          scope.camera.rotation.x = Math.max(_PI_2 - Math.PI, Math.min(_PI_2 - 0, scope.camera.rotation.x - screenTrasformY));
          break;
      }
    });
  }
}

const STEPS_PER_FRAME = 5;
const GRAVITY = 30;
const vec3Util = new Vector3();
const config = {
  groundControlFactor: 20,
  airControlFactor: 5,
  dampFactor: -10,
  movespeedFactor: 2.4
};
class MovementController {
  playerOctree = GameContext.Physical.WorldOCTree;
  playerCamera;
  playerCollider;
  playerOnFloor = true;
  keyStates = /* @__PURE__ */ new Map();
  playerVelocity = new Vector3();
  playerDirection = new Vector3();
  init() {
    this.playerOctree = GameContext.Physical.WorldOCTree;
    this.playerCamera = GameContext.Cameras.PlayerCamera;
    this.playerCollider = new Capsule(new Vector3(0, 0.35, 0), new Vector3(0, 1.45, 0), 0.35);
    UserInputEventPipe.addEventListener(UserInputEvent.type, (e) => {
      switch (e.detail.enum) {
        case UserInputEventEnum.MOVE_FORWARD_DOWN:
          this.keyStates.set(UserInputEventEnum.MOVE_FORWARD_DOWN, true);
          break;
        case UserInputEventEnum.MOVE_BACKWARD_DOWN:
          this.keyStates.set(UserInputEventEnum.MOVE_BACKWARD_DOWN, true);
          break;
        case UserInputEventEnum.MOVE_LEFT_DOWN:
          this.keyStates.set(UserInputEventEnum.MOVE_LEFT_DOWN, true);
          break;
        case UserInputEventEnum.MOVE_RIGHT_DOWN:
          this.keyStates.set(UserInputEventEnum.MOVE_RIGHT_DOWN, true);
          break;
        case UserInputEventEnum.MOVE_FORWARD_UP:
          this.keyStates.set(UserInputEventEnum.MOVE_FORWARD_DOWN, false);
          break;
        case UserInputEventEnum.MOVE_BACKWARD_UP:
          this.keyStates.set(UserInputEventEnum.MOVE_BACKWARD_DOWN, false);
          break;
        case UserInputEventEnum.MOVE_LEFT_UP:
          this.keyStates.set(UserInputEventEnum.MOVE_LEFT_DOWN, false);
          break;
        case UserInputEventEnum.MOVE_RIGHT_UP:
          this.keyStates.set(UserInputEventEnum.MOVE_RIGHT_DOWN, false);
          break;
        case UserInputEventEnum.JUMP:
          this.jump();
          break;
      }
    });
  }
  callEveryFrame(deltaTime, elapsedTime) {
    const dt = Math.min(0.05, deltaTime) / STEPS_PER_FRAME;
    for (let i = 0; i < STEPS_PER_FRAME; i++) {
      this.controls(dt);
      this.updatePlayer(dt);
      this.teleportPlayerIfOob();
    }
  }
  controls(deltaTime) {
    const airControlFactor = deltaTime * (this.playerOnFloor ? config.groundControlFactor : config.airControlFactor);
    this.playerDirection.set(0, 0, 0);
    if (this.playerOnFloor) {
      if (this.keyStates.get(UserInputEventEnum.MOVE_FORWARD_DOWN))
        this.playerDirection.add(this.getForwardVector().normalize());
      if (this.keyStates.get(UserInputEventEnum.MOVE_BACKWARD_DOWN))
        this.playerDirection.add(this.getForwardVector().normalize().multiplyScalar(-1));
      if (this.keyStates.get(UserInputEventEnum.MOVE_LEFT_DOWN))
        this.playerDirection.add(this.getSideVector().normalize().multiplyScalar(-1));
      if (this.keyStates.get(UserInputEventEnum.MOVE_RIGHT_DOWN))
        this.playerDirection.add(this.getSideVector().normalize());
      if (this.playerDirection.lengthSq() > 1)
        this.playerDirection.normalize();
    }
    this.playerVelocity.add(this.playerDirection.multiplyScalar(airControlFactor * config.movespeedFactor));
  }
  updatePlayer(deltaTime) {
    let damping = Math.exp(config.dampFactor * deltaTime) - 1;
    if (!this.playerOnFloor) {
      this.playerVelocity.y -= GRAVITY * deltaTime;
      damping *= 0.1;
    }
    this.playerVelocity.addScaledVector(this.playerVelocity, damping);
    const deltaPosition = this.playerVelocity.clone().multiplyScalar(deltaTime);
    this.playerCollider.translate(deltaPosition);
    const result = this.playerOctree.capsuleIntersect(this.playerCollider);
    this.playerOnFloor = false;
    if (result) {
      this.playerOnFloor = result.normal.y > 0;
      if (!this.playerOnFloor)
        this.playerVelocity.addScaledVector(result.normal, -result.normal.dot(this.playerVelocity));
      this.playerCollider.translate(result.normal.multiplyScalar(result.depth));
    }
    this.playerCamera.position.copy(this.playerCollider.end);
  }
  teleportPlayerIfOob() {
    if (this.playerCamera.position.y <= -25) {
      this.playerCollider.start.set(0, 0.35, 0);
      this.playerCollider.end.set(0, 1, 0);
      this.playerCollider.radius = 0.35;
      this.playerCamera.position.copy(this.playerCollider.end);
      this.playerCamera.rotation.set(0, 0, 0);
    }
  }
  getForwardVector() {
    this.playerCamera.getWorldDirection(vec3Util);
    vec3Util.y = 0;
    vec3Util.normalize();
    return vec3Util;
  }
  getSideVector() {
    this.playerCamera.getWorldDirection(vec3Util);
    vec3Util.y = 0;
    vec3Util.normalize();
    vec3Util.cross(this.playerCamera.up);
    return vec3Util;
  }
  jump() {
    if (this.playerOnFloor) {
      this.playerVelocity.y = 8;
    }
  }
}

const roleTexture = GameContext.GameResources.textureLoader.load("/role/role.TF2.heavy.png");
dealWithRoleTexture(roleTexture);
const roleMaterial = new MeshBasicMaterial({ map: roleTexture });
dealWithRoleMaterial(roleMaterial);
class LocalPlayer {
  static localPlayerInstance;
  constructor() {
  }
  static getInstance() {
    if (!this.localPlayerInstance)
      this.localPlayerInstance = new LocalPlayer();
    return this.localPlayerInstance;
  }
  init() {
    this.userInputSystem = new UserInputSystem();
    this.weaponSystem = WeaponSystem.getInstance();
    this.cameraController = new FPSCameraController();
    this.cameraController.init();
    this.movementController = new MovementController();
    this.movementController.init();
    this.inventorySystem = new InventorySystem();
    this.inventorySystem.init();
    const ak47 = new AK47();
    this.inventorySystem.pickUpWeapon(ak47);
    const usp = new USP();
    this.inventorySystem.pickUpWeapon(usp);
    const m9 = new M9();
    this.inventorySystem.pickUpWeapon(m9);
    this.inventorySystem.switchEquipment(InventorySlotEnum.Primary);
  }
  userInputSystem;
  inventorySystem;
  weaponSystem;
  cameraController;
  movementController;
  roleMaterial = roleMaterial;
  callEveryFrame(deltaTime, elapsedTime) {
    this.movementController.callEveryFrame(deltaTime, elapsedTime);
    this.inventorySystem.callEveryFrame(deltaTime, elapsedTime);
  }
}

var Stats = function () {

	var mode = 0;

	var container = document.createElement( 'div' );
	container.style.cssText = 'position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000';
	container.addEventListener( 'click', function ( event ) {

		event.preventDefault();
		showPanel( ++ mode % container.children.length );

	}, false );

	//

	function addPanel( panel ) {

		container.appendChild( panel.dom );
		return panel;

	}

	function showPanel( id ) {

		for ( var i = 0; i < container.children.length; i ++ ) {

			container.children[ i ].style.display = i === id ? 'block' : 'none';

		}

		mode = id;

	}

	//

	var beginTime = ( performance || Date ).now(), prevTime = beginTime, frames = 0;

	var fpsPanel = addPanel( new Stats.Panel( 'FPS', '#0ff', '#002' ) );
	var msPanel = addPanel( new Stats.Panel( 'MS', '#0f0', '#020' ) );

	if ( self.performance && self.performance.memory ) {

		var memPanel = addPanel( new Stats.Panel( 'MB', '#f08', '#201' ) );

	}

	showPanel( 0 );

	return {

		REVISION: 16,

		dom: container,

		addPanel: addPanel,
		showPanel: showPanel,

		begin: function () {

			beginTime = ( performance || Date ).now();

		},

		end: function () {

			frames ++;

			var time = ( performance || Date ).now();

			msPanel.update( time - beginTime, 200 );

			if ( time >= prevTime + 1000 ) {

				fpsPanel.update( ( frames * 1000 ) / ( time - prevTime ), 100 );

				prevTime = time;
				frames = 0;

				if ( memPanel ) {

					var memory = performance.memory;
					memPanel.update( memory.usedJSHeapSize / 1048576, memory.jsHeapSizeLimit / 1048576 );

				}

			}

			return time;

		},

		update: function () {

			beginTime = this.end();

		},

		// Backwards Compatibility

		domElement: container,
		setMode: showPanel

	};

};

Stats.Panel = function ( name, fg, bg ) {

	var min = Infinity, max = 0, round = Math.round;
	var PR = round( window.devicePixelRatio || 1 );

	var WIDTH = 80 * PR, HEIGHT = 48 * PR,
		TEXT_X = 3 * PR, TEXT_Y = 2 * PR,
		GRAPH_X = 3 * PR, GRAPH_Y = 15 * PR,
		GRAPH_WIDTH = 74 * PR, GRAPH_HEIGHT = 30 * PR;

	var canvas = document.createElement( 'canvas' );
	canvas.width = WIDTH;
	canvas.height = HEIGHT;
	canvas.style.cssText = 'width:80px;height:48px';

	var context = canvas.getContext( '2d' );
	context.font = 'bold ' + ( 9 * PR ) + 'px Helvetica,Arial,sans-serif';
	context.textBaseline = 'top';

	context.fillStyle = bg;
	context.fillRect( 0, 0, WIDTH, HEIGHT );

	context.fillStyle = fg;
	context.fillText( name, TEXT_X, TEXT_Y );
	context.fillRect( GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT );

	context.fillStyle = bg;
	context.globalAlpha = 0.9;
	context.fillRect( GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT );

	return {

		dom: canvas,

		update: function ( value, maxValue ) {

			min = Math.min( min, value );
			max = Math.max( max, value );

			context.fillStyle = bg;
			context.globalAlpha = 1;
			context.fillRect( 0, 0, WIDTH, GRAPH_Y );
			context.fillStyle = fg;
			context.fillText( round( value ) + ' ' + name + ' (' + round( min ) + '-' + round( max ) + ')', TEXT_X, TEXT_Y );

			context.drawImage( canvas, GRAPH_X + PR, GRAPH_Y, GRAPH_WIDTH - PR, GRAPH_HEIGHT, GRAPH_X, GRAPH_Y, GRAPH_WIDTH - PR, GRAPH_HEIGHT );

			context.fillRect( GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, GRAPH_HEIGHT );

			context.fillStyle = bg;
			context.globalAlpha = 0.9;
			context.fillRect( GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, round( ( 1 - ( value / maxValue ) ) * GRAPH_HEIGHT ) );

		}

	};

};

const Stats$1 = Stats;

class DOMLayer extends EventTarget {
  stats = Stats$1();
  init() {
    const blocker = document.createElement("div");
    blocker.id = "blocker";
    const instructions = document.createElement("div");
    instructions.id = "instructions";
    const tip1 = document.createElement("p");
    tip1.innerHTML = "CLICK TO PLAY";
    instructions.appendChild(tip1);
    blocker.appendChild(instructions);
    GameContext.GameView.Container.appendChild(blocker);
    GameContext.GameView.Container.appendChild(GameContext.GameView.Renderer.domElement);
    GameContext.PointLock.pointLockListen();
    instructions.addEventListener("click", () => {
      if (!GameContext.PointLock.isLocked)
        GameContext.PointLock.lock();
    });
    DomEventPipe.addEventListener(PointLockEvent.type, (e) => {
      switch (e.detail.enum) {
        case PointLockEventEnum.LOCK:
          instructions.style.display = "none";
          blocker.style.display = "none";
          break;
        case PointLockEventEnum.UNLOCK:
          blocker.style.display = "block";
          instructions.style.display = "";
          break;
      }
    });
    GameContext.GameView.Container.appendChild(this.stats.dom);
  }
  callEveryFrame(deltaTime, elapsedTime) {
    this.stats.update();
  }
}

/**
 * NVIDIA FXAA by Timothy Lottes
 * https://developer.download.nvidia.com/assets/gamedev/files/sdk/11/FXAA_WhitePaper.pdf
 * - WebGL port by @supereggbert
 * http://www.glge.org/demos/fxaa/
 * Further improved by Daniel Sturk
 */

const FXAAShader = {

	uniforms: {

		'tDiffuse': { value: null },
		'resolution': { value: new Vector2( 1 / 1024, 1 / 512 ) }

	},

	vertexShader: /* glsl */`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,

	fragmentShader: `
	precision highp float;

	uniform sampler2D tDiffuse;

	uniform vec2 resolution;

	varying vec2 vUv;

	// FXAA 3.11 implementation by NVIDIA, ported to WebGL by Agost Biro (biro@archilogic.com)

	//----------------------------------------------------------------------------------
	// File:        es3-kepler\FXAA\assets\shaders/FXAA_DefaultES.frag
	// SDK Version: v3.00
	// Email:       gameworks@nvidia.com
	// Site:        http://developer.nvidia.com/
	//
	// Copyright (c) 2014-2015, NVIDIA CORPORATION. All rights reserved.
	//
	// Redistribution and use in source and binary forms, with or without
	// modification, are permitted provided that the following conditions
	// are met:
	//  * Redistributions of source code must retain the above copyright
	//    notice, this list of conditions and the following disclaimer.
	//  * Redistributions in binary form must reproduce the above copyright
	//    notice, this list of conditions and the following disclaimer in the
	//    documentation and/or other materials provided with the distribution.
	//  * Neither the name of NVIDIA CORPORATION nor the names of its
	//    contributors may be used to endorse or promote products derived
	//    from this software without specific prior written permission.
	//
	// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS ''AS IS'' AND ANY
	// EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
	// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
	// PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR
	// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
	// EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
	// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
	// PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
	// OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	//
	//----------------------------------------------------------------------------------

	#ifndef FXAA_DISCARD
			//
			// Only valid for PC OpenGL currently.
			// Probably will not work when FXAA_GREEN_AS_LUMA = 1.
			//
			// 1 = Use discard on pixels which don't need AA.
			//     For APIs which enable concurrent TEX+ROP from same surface.
			// 0 = Return unchanged color on pixels which don't need AA.
			//
			#define FXAA_DISCARD 0
	#endif

	/*--------------------------------------------------------------------------*/
	#define FxaaTexTop(t, p) texture2D(t, p, -100.0)
	#define FxaaTexOff(t, p, o, r) texture2D(t, p + (o * r), -100.0)
	/*--------------------------------------------------------------------------*/

	#define NUM_SAMPLES 5

	// assumes colors have premultipliedAlpha, so that the calculated color contrast is scaled by alpha
	float contrast( vec4 a, vec4 b ) {
			vec4 diff = abs( a - b );
			return max( max( max( diff.r, diff.g ), diff.b ), diff.a );
	}

	/*============================================================================

									FXAA3 QUALITY - PC

	============================================================================*/

	/*--------------------------------------------------------------------------*/
	vec4 FxaaPixelShader(
			vec2 posM,
			sampler2D tex,
			vec2 fxaaQualityRcpFrame,
			float fxaaQualityEdgeThreshold,
			float fxaaQualityinvEdgeThreshold
	) {
			vec4 rgbaM = FxaaTexTop(tex, posM);
			vec4 rgbaS = FxaaTexOff(tex, posM, vec2( 0.0, 1.0), fxaaQualityRcpFrame.xy);
			vec4 rgbaE = FxaaTexOff(tex, posM, vec2( 1.0, 0.0), fxaaQualityRcpFrame.xy);
			vec4 rgbaN = FxaaTexOff(tex, posM, vec2( 0.0,-1.0), fxaaQualityRcpFrame.xy);
			vec4 rgbaW = FxaaTexOff(tex, posM, vec2(-1.0, 0.0), fxaaQualityRcpFrame.xy);
			// . S .
			// W M E
			// . N .

			bool earlyExit = max( max( max(
					contrast( rgbaM, rgbaN ),
					contrast( rgbaM, rgbaS ) ),
					contrast( rgbaM, rgbaE ) ),
					contrast( rgbaM, rgbaW ) )
					< fxaaQualityEdgeThreshold;
			// . 0 .
			// 0 0 0
			// . 0 .

			#if (FXAA_DISCARD == 1)
					if(earlyExit) FxaaDiscard;
			#else
					if(earlyExit) return rgbaM;
			#endif

			float contrastN = contrast( rgbaM, rgbaN );
			float contrastS = contrast( rgbaM, rgbaS );
			float contrastE = contrast( rgbaM, rgbaE );
			float contrastW = contrast( rgbaM, rgbaW );

			float relativeVContrast = ( contrastN + contrastS ) - ( contrastE + contrastW );
			relativeVContrast *= fxaaQualityinvEdgeThreshold;

			bool horzSpan = relativeVContrast > 0.;
			// . 1 .
			// 0 0 0
			// . 1 .

			// 45 deg edge detection and corners of objects, aka V/H contrast is too similar
			if( abs( relativeVContrast ) < .3 ) {
					// locate the edge
					vec2 dirToEdge;
					dirToEdge.x = contrastE > contrastW ? 1. : -1.;
					dirToEdge.y = contrastS > contrastN ? 1. : -1.;
					// . 2 .      . 1 .
					// 1 0 2  ~=  0 0 1
					// . 1 .      . 0 .

					// tap 2 pixels and see which ones are "outside" the edge, to
					// determine if the edge is vertical or horizontal

					vec4 rgbaAlongH = FxaaTexOff(tex, posM, vec2( dirToEdge.x, -dirToEdge.y ), fxaaQualityRcpFrame.xy);
					float matchAlongH = contrast( rgbaM, rgbaAlongH );
					// . 1 .
					// 0 0 1
					// . 0 H

					vec4 rgbaAlongV = FxaaTexOff(tex, posM, vec2( -dirToEdge.x, dirToEdge.y ), fxaaQualityRcpFrame.xy);
					float matchAlongV = contrast( rgbaM, rgbaAlongV );
					// V 1 .
					// 0 0 1
					// . 0 .

					relativeVContrast = matchAlongV - matchAlongH;
					relativeVContrast *= fxaaQualityinvEdgeThreshold;

					if( abs( relativeVContrast ) < .3 ) { // 45 deg edge
							// 1 1 .
							// 0 0 1
							// . 0 1

							// do a simple blur
							return mix(
									rgbaM,
									(rgbaN + rgbaS + rgbaE + rgbaW) * .25,
									.4
							);
					}

					horzSpan = relativeVContrast > 0.;
			}

			if(!horzSpan) rgbaN = rgbaW;
			if(!horzSpan) rgbaS = rgbaE;
			// . 0 .      1
			// 1 0 1  ->  0
			// . 0 .      1

			bool pairN = contrast( rgbaM, rgbaN ) > contrast( rgbaM, rgbaS );
			if(!pairN) rgbaN = rgbaS;

			vec2 offNP;
			offNP.x = (!horzSpan) ? 0.0 : fxaaQualityRcpFrame.x;
			offNP.y = ( horzSpan) ? 0.0 : fxaaQualityRcpFrame.y;

			bool doneN = false;
			bool doneP = false;

			float nDist = 0.;
			float pDist = 0.;

			vec2 posN = posM;
			vec2 posP = posM;

			int iterationsUsed = 0;
			int iterationsUsedN = 0;
			int iterationsUsedP = 0;
			for( int i = 0; i < NUM_SAMPLES; i++ ) {
					iterationsUsed = i;

					float increment = float(i + 1);

					if(!doneN) {
							nDist += increment;
							posN = posM + offNP * nDist;
							vec4 rgbaEndN = FxaaTexTop(tex, posN.xy);
							doneN = contrast( rgbaEndN, rgbaM ) > contrast( rgbaEndN, rgbaN );
							iterationsUsedN = i;
					}

					if(!doneP) {
							pDist += increment;
							posP = posM - offNP * pDist;
							vec4 rgbaEndP = FxaaTexTop(tex, posP.xy);
							doneP = contrast( rgbaEndP, rgbaM ) > contrast( rgbaEndP, rgbaN );
							iterationsUsedP = i;
					}

					if(doneN || doneP) break;
			}


			if ( !doneP && !doneN ) return rgbaM; // failed to find end of edge

			float dist = min(
					doneN ? float( iterationsUsedN ) / float( NUM_SAMPLES - 1 ) : 1.,
					doneP ? float( iterationsUsedP ) / float( NUM_SAMPLES - 1 ) : 1.
			);

			// hacky way of reduces blurriness of mostly diagonal edges
			// but reduces AA quality
			dist = pow(dist, .5);

			dist = 1. - dist;

			return mix(
					rgbaM,
					rgbaN,
					dist * .5
			);
	}

	void main() {
			const float edgeDetectionQuality = .2;
			const float invEdgeDetectionQuality = 1. / edgeDetectionQuality;

			gl_FragColor = FxaaPixelShader(
					vUv,
					tDiffuse,
					resolution,
					edgeDetectionQuality, // [0,1] contrast needed, otherwise early discard
					invEdgeDetectionQuality
			);

	}
	`

};

class GLViewportLayer {
  fxaaPass = new ShaderPass(FXAAShader);
  rendererSize = new Vector2();
  init() {
    GameContext.GameView.Renderer.autoClear = false;
    GameContext.GameView.Renderer.autoClearDepth = false;
    GameContext.GameView.Renderer.autoClearStencil = false;
  }
  updateFXAAUnifroms() {
    GameContext.GameView.Renderer.getSize(this.rendererSize);
    this.fxaaPass.material.uniforms["resolution"].value.set(1 / this.rendererSize.x, 1 / this.rendererSize.y);
  }
  callEveryFrame(deltaTime, elapsedTime) {
    GameContext.GameView.Renderer.render(GameContext.Scenes.Skybox, GameContext.Cameras.PlayerCamera);
    GameContext.GameView.Renderer.clearDepth();
    GameContext.GameView.Renderer.render(GameContext.Scenes.Level, GameContext.Cameras.PlayerCamera);
    GameContext.GameView.Renderer.render(GameContext.Scenes.Sprites, GameContext.Cameras.PlayerCamera);
    GameContext.GameView.Renderer.clearDepth();
    GameContext.GameView.Renderer.render(GameContext.Scenes.Handmodel, GameContext.Cameras.HandModelCamera);
    GameContext.GameView.Renderer.clearDepth();
    GameContext.GameView.Renderer.render(GameContext.Scenes.UI, GameContext.Cameras.UICamera);
  }
}

const bulletHoleAshVertex = "attribute float rand;// 给弹孔随机大小 0.5 ~ 1\r\nattribute float generTime;\r\n\r\nuniform float uExitTime;\r\nuniform float uFadeTime;// 渐变消失时间\r\nuniform float uTime;// 当前时间\r\nuniform float uScale;// 弹孔大小\r\n\r\nvarying float vElapsed;// 传递弹点生成时间\r\nvarying float vRand;\r\n\r\nvec3 upperDirection=vec3(0.,1.,0.);\r\n\r\nvoid main()\r\n{\r\n    \r\n    vRand=rand;\r\n    \r\n    // 计算弹孔点的位置(基础位置)\r\n    \r\n    vec3 pointPosition=position;\r\n    pointPosition+=normalize(cameraPosition-position)*.01;//朝着相机方向移动(基础)\r\n    pointPosition+=normal*.2;// 灰尘会朝着命中的面的法线方向移动\r\n    pointPosition+=upperDirection*.1;\r\n    \r\n    // 计算弹孔点的大小\r\n    \r\n    float pointSize=32.;// 弹孔默认大小\r\n    pointSize+=64.*rand;// 弹孔默认大小受到随机值影响后的值\r\n    pointSize*=uScale;// 点大小受到uniform自定义值影响\r\n    \r\n    float elapsed=uTime-generTime;// 已经存在时间\r\n    vElapsed=elapsed;\r\n    float disapperTime=uExitTime+uFadeTime;// 消失总时间\r\n    \r\n    pointPosition+=(1.*normal+.5*upperDirection)*elapsed;// S=v*t\r\n    pointSize*=.25+elapsed/disapperTime*.2;\r\n    \r\n    // 点位置\r\n    \r\n    gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(pointPosition,1.);\r\n    \r\n    // 点大小\r\n    \r\n    gl_PointSize=pointSize;\r\n    vec4 viewPosition=viewMatrix*vec4(pointPosition,1.);\r\n    gl_PointSize*=(1./-viewPosition.z);// 点大小受到距离远近影响\r\n    \r\n}";

const bulletHoleAshFrag = "uniform float uOpacity;\r\nuniform float uExitTime;\r\nuniform float uFadeTime;// 渐变消失时间\r\nuniform sampler2D uAshT;\r\n\r\nvarying float vElapsed;// 传递弹点生成时间\r\nvarying float vRand;\r\n\r\nmat4 makeRotationZ(float theta)\r\n{\r\n    return mat4(\r\n        cos(theta),-sin(theta),0,0,\r\n        sin(theta),cos(theta),0,0,\r\n        0,0,1,0,\r\n        0,0,0,1\r\n    );\r\n}\r\n\r\nvoid main()\r\n{\r\n    float fadeMask=step(uExitTime,vElapsed);// 开始渐变消失为1\r\n    fadeMask*=(vElapsed-uExitTime)/uFadeTime;\r\n    \r\n    if(uOpacity-fadeMask<0.){// 提升一下性能\r\n        discard;\r\n    }\r\n    \r\n    vec4 randRotate=makeRotationZ(vRand*3.14)*vec4(gl_PointCoord-vec2(.5),0.,1.);// gl.POINTS, (left,top):(0,0) (right, bottom): (1, 1)\r\n    vec4 colorFromT=texture2D(uAshT,randRotate.xy+vec2(.5));// matrix 是用(0, 0)点做中心点进行旋转的\r\n    \r\n    gl_FragColor=vec4(colorFromT.rgb,colorFromT.a*(uOpacity-fadeMask)*vRand);\r\n}";

const ashTexture = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAMAAAD04JH5AAAAeFBMVEUAAAD////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////GqOSsAAAAKHRSTlMABR8kKS43EQ0JGjJAFTtMUEhYVEVlYFxqF25yfYx4dYCHkZaEm56k5s4VQQAADrpJREFUeNrsWdly2zAMrHjJEmmKOqwjmWn//y+7C9C1J32ymrQvRcd2ZpoIy8ViASbf/sf/+B+fFk3TfPtHweRd1zC+/QsQXYu4XP4NhKZre2OubcUgCAjhL8FoLshure37/rhegYAQNL4cgp7+evS99dEZoxBaFqLGVwOg8C5EYL0nALJwkIWuxpcjUADX3jpnjakQqhokui9D0DwAtALAWUsMSoKG1OMLEGibNffev4ABAwT+gUGj0tF9ev7nr7UG7APnvUUgv9FXjf5zETT15F0t7gOAj1GUyJ7UzF+BoLmXAPL6DUBI4xJQBhc9JBmCR1UUQfPp2nu8CYJDAPi4DCla63PyxpetjMPipSiX5vPo/+gwlQLRgA+ZOowhxjBst/22zksIDjb95whIu9o7M8rU+SgC50MaAij3Kaey7m9vt9s2j8n/uQya7uGuHdOr0zw1otQAGpjmBCkO07Tu7+9vt2kuS6ZFnqZAUzChjhjNfhWruXykIGYgwKGHeb29IXZ8nUKKfwpA3VYQXJiqN2z3nrQ+jwPj4EUxTeu63hD7G163ObgQbH98AoArLV7mjmMmb462+QCAfZDKtm04/w4A6zqNHl1pe9jheQCVYufEYmzNb4/LswrpxhzJeYbwoP99B4Z1DBFdIRU4D6CqzHoEipwCjokwbfcbAIfmA/0rji4kTNE6qdbRngbQSH5kMGyyZRzKkFLK0RHAhxIYF6DBHQysEOH7+76N2Ut+COjUYqB9L43X9i7mZSzzXMYlIf9xeQBoFAAsME0g/7YSwE4Zzsn2kh8AmrO+TwraqwEBaSzTNA84FwC0DwSyltGJHPxv3aYJb6v0wVSCLord2fx3tz8s678MM6xlWHI0z+tn9WIOAUAc0zCxEUkEfIDfKQy8br33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";

const image$5 = new Image();
const texture$5 = new Texture(image$5);
image$5.src = ashTexture;
image$5.onload = () => {
  texture$5.needsUpdate = true;
};
const array3Util$5 = new Array(3);
const array1Util$5 = new Array(1);
class BulletHoleAshLayer {
  scene;
  maximun = 10;
  bulletHoleOpacity = 0.4;
  bulletHoleScale = 15;
  exitTime = 0.1;
  fadeTime = 0.1;
  bulletHoleGeometry = new BufferGeometry();
  bulletHoleMaterial = new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: this.bulletHoleOpacity },
      uScale: { value: this.bulletHoleScale },
      uExitTime: { value: this.exitTime },
      uFadeTime: { value: this.fadeTime },
      uAshT: { value: texture$5 }
    },
    blending: AdditiveBlending,
    transparent: true,
    vertexShader: bulletHoleAshVertex,
    fragmentShader: bulletHoleAshFrag
  });
  positionFoat32Array;
  normalFoat32Array;
  generTimeFLoat32Array;
  randFoat32Array;
  positionBufferAttribute;
  normalBufferAttribute;
  generTimeBufferAttribute;
  randBufferAttribute;
  bulletHoleIndex = 0;
  init() {
    this.scene = GameContext.Scenes.Sprites;
    this.bulletHoleMaterial.depthWrite = false;
    this.positionFoat32Array = new Float32Array(new ArrayBuffer(4 * 3 * this.maximun));
    this.normalFoat32Array = new Float32Array(new ArrayBuffer(4 * 3 * this.maximun));
    this.generTimeFLoat32Array = new Float32Array(new ArrayBuffer(4 * this.maximun));
    this.randFoat32Array = new Float32Array(new ArrayBuffer(4 * this.maximun));
    for (let i = 0; i < this.maximun; i++) {
      array1Util$5[0] = -10;
      this.generTimeFLoat32Array.set(array1Util$5, i);
    }
    const bulletHoles = new Points(this.bulletHoleGeometry, this.bulletHoleMaterial);
    bulletHoles.frustumCulled = false;
    this.scene.add(bulletHoles);
    this.positionBufferAttribute = new BufferAttribute(this.positionFoat32Array, 3);
    this.normalBufferAttribute = new BufferAttribute(this.normalFoat32Array, 3);
    this.generTimeBufferAttribute = new BufferAttribute(this.generTimeFLoat32Array, 1);
    this.randBufferAttribute = new BufferAttribute(this.randFoat32Array, 1);
    this.bulletHoleGeometry.setAttribute("position", this.positionBufferAttribute);
    this.bulletHoleGeometry.setAttribute("normal", this.normalBufferAttribute);
    this.bulletHoleGeometry.setAttribute("generTime", this.generTimeBufferAttribute);
    this.bulletHoleGeometry.setAttribute("rand", this.randBufferAttribute);
    LayerEventPipe.addEventListener(BulletFallenPointEvent.type, (e) => {
      this.addPoint(e.detail.fallenPoint, e.detail.fallenNormal);
    });
  }
  addPoint(point, normal) {
    const random = 0.5 + Math.random() * 0.5;
    this.positionFoat32Array.set(point.toArray(array3Util$5, 0), this.bulletHoleIndex * 3);
    this.normalFoat32Array.set(normal.toArray(array3Util$5, 0), this.bulletHoleIndex * 3);
    array1Util$5[0] = GameContext.GameLoop.Clock.getElapsedTime();
    this.generTimeFLoat32Array.set(array1Util$5, this.bulletHoleIndex);
    array1Util$5[0] = random;
    this.randFoat32Array.set(array1Util$5, this.bulletHoleIndex);
    if (this.bulletHoleIndex + 1 >= this.maximun)
      this.bulletHoleIndex = 0;
    else
      this.bulletHoleIndex += 1;
    this.positionBufferAttribute.needsUpdate = true;
    this.normalBufferAttribute.needsUpdate = true;
    this.generTimeBufferAttribute.needsUpdate = true;
    this.randBufferAttribute.needsUpdate = true;
  }
  callEveryFrame(deltaTime, elapsedTime) {
    this.bulletHoleMaterial.uniforms.uTime.value = elapsedTime;
  }
}

const bulletHoleVertex$1 = "attribute float rand;// 给弹孔随机大小\r\nattribute float generTime;\r\n\r\nuniform float uTime;// 当前时间\r\nuniform float uScale;// 弹孔大小\r\n\r\nvarying float vRand;\r\nvarying float elapsed;// 传递弹点存在时间\r\n\r\nvoid main()\r\n{\r\n    \r\n    vRand=rand;\r\n    elapsed=uTime-generTime;// 已经存在时间\r\n    \r\n    // 计算弹孔点的位置\r\n    vec3 position1=position;\r\n    position1+=normalize(cameraPosition-position)*.05;//朝着相机方向移动(基础)\r\n    position1+=normal*.05;// 朝着命中的面的法线方向移动\r\n    gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position1,1.);// 点位置\r\n    \r\n    // 计算弹孔点的大小\r\n    \r\n    gl_PointSize=32.;// 弹孔默认大小\r\n    gl_PointSize+=(48.*rand);// 弹孔默认大小受到随机值影响后的值\r\n    gl_PointSize*=uScale;// 点大小受到uniform自定义值影响\r\n    vec4 viewPosition=viewMatrix*vec4(position1,1.);\r\n    gl_PointSize*=(1./-viewPosition.z);// 点大小受到距离远近影响\r\n    \r\n}";

const bulletHoleFrag$1 = "uniform float uOpacity;\r\nuniform float uFlashTime;//闪烁时间\r\nuniform sampler2D uFlashT;\r\n\r\nvarying float vRand;\r\nvarying float elapsed;// 传递弹点存在时间\r\n\r\nmat4 makeRotationZ(float theta)\r\n{\r\n    return mat4(\r\n        cos(theta),-sin(theta),0,0,\r\n        sin(theta),cos(theta),0,0,\r\n        0,0,1,0,\r\n        0,0,0,1\r\n    );\r\n}\r\n\r\nvoid main()\r\n{\r\n    \r\n    float fadeMask=step(elapsed,uFlashTime);\r\n    \r\n    if(fadeMask<1.){\r\n        discard;\r\n    }\r\n    \r\n    vec4 randRotate=makeRotationZ(vRand*3.14)*vec4(gl_PointCoord-vec2(.5),0.,1.);\r\n    vec4 colorFromT=texture2D(uFlashT,randRotate.xy+vec2(.5));\r\n    \r\n    gl_FragColor=vec4(colorFromT.rgb,fadeMask*uOpacity*colorFromT.a);\r\n    \r\n}";

const flashTexture$1 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAMAAAD04JH5AAADAFBMVEUAAADankDXnkHipUbmpkXkp0nlqEjprEborEXrs07oq0frs07rsEzwtEzwtU/vtE3vtE3ssUzrr0zytE7vs07us0/xtUz2uU/0t1Dglzn1tUv3tVL3tVH2t1DztEv0tk3nmS71tk/ytFD0tU34uVX3tkv3tE7mli76t1X5uVf6tVP3pyPoq0j5tFH3qST4szPvqDr5slb4tkr3pSL0qC34rSn3riT5wE/5tFbxoiHrmyTplyTqlyT5vEv2rzv4tUf5qB/6tk/5sU/zpSHvoCbupCX3qyH5vFH6uk/5sTb4uVXwpC3slR7nkib2qSzxpjH5sjT6uDr5rCH6tzr4skb3tkHzqzj7xDv6wU35tC75vkv5szT1qSP1rDr2sDj5wFP1ox75sUH4skH1rDb4qx76uU70oyL3qB/4tj33qR/6v0X6vzT6uzz3ox70oh30qzblkSzxqCr5szr3rDHvqTv6tCH2u1L0py75rzH4szXulhnyqzn6y036xD74tyv6vUX6uTz0oiHrlyD5ukr5sDf3rjP5sTP5uS782Er1ulH1t0/5wjP71Er70jT5uj/5szH4uTP5uDrrojz5wkn5px73sSf4tkf7zUT71Uv6zE74sDT4vif3sUT5syfnkB35vUT2uiX3tyL60zP71zb6zy/7zUf5xjT5xDXwnxn6xzfkjB784FP1uTT84jPyoB7pkxjqkhf87ELjgxb51jD85z7//////37//3T//4P//2P//4////n//2v//6b//2///1P//3n//2f//1///1f//5T//7H//6H//07//5j//1v//9v//4r//7f//0r//z3///X//6v//0H//8X//7z//zb//+P//+r//8///5z91zr//9X//4f//8r//8D/+U792Sr///D/7GD+3kD7vDX/5V75xlX//0X911r7zlb8zTv//yz/8FD/6y38wyH/8mb2vlT/70D/+UT/9UP/9S38zSb6qyL/+Wb/3lv+5UH8uyT+5k//8zT8xy/+4i370C7/+jrNrqzkAAAAtXRSTlMAAgMEBgUIDQsQCRUSHyglLB0XLxsZIkc3EENPU0s0OhhAMj1jXVgUc2yPgiF5c2gpf2aNbXvAv4hdOSMe2IJsqZWDVFAt1aqbmlxMPimJ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";

const image$4 = new Image();
const texture$4 = new Texture(image$4);
image$4.src = flashTexture$1;
image$4.onload = () => {
  texture$4.needsUpdate = true;
};
const array3Util$4 = new Array(3);
const array1Util$4 = new Array(1);
class BulletHoleFlashLayer {
  scene;
  maximun = 10;
  bulletHoleOpacity = 1;
  bulletHoleScale = 1.5;
  bulletHoleFlashTime = 0.03;
  bulletHoleGeometry = new BufferGeometry();
  bulletHoleMaterial = new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: this.bulletHoleOpacity },
      uScale: { value: this.bulletHoleScale },
      uFlashTime: { value: this.bulletHoleFlashTime },
      uFlashT: { value: texture$4 }
    },
    depthWrite: false,
    blending: AdditiveBlending,
    side: FrontSide,
    transparent: true,
    vertexShader: bulletHoleVertex$1,
    fragmentShader: bulletHoleFrag$1
  });
  positionFoat32Array;
  normalFoat32Array;
  generTimeFLoat32Array;
  randFoat32Array;
  positionBufferAttribute;
  normalBufferAttribute;
  generTimeBufferAttribute;
  randBufferAttribute;
  bulletHoleIndex = 0;
  init() {
    this.positionFoat32Array = new Float32Array(new ArrayBuffer(4 * 3 * this.maximun));
    this.normalFoat32Array = new Float32Array(new ArrayBuffer(4 * 3 * this.maximun));
    this.generTimeFLoat32Array = new Float32Array(new ArrayBuffer(4 * this.maximun));
    this.randFoat32Array = new Float32Array(new ArrayBuffer(4 * this.maximun));
    for (let i = 0; i < this.maximun; i++) {
      array1Util$4[0] = -10;
      this.generTimeFLoat32Array.set(array1Util$4, i);
    }
    this.scene = GameContext.Scenes.Sprites;
    const bulletHoles = new Points(this.bulletHoleGeometry, this.bulletHoleMaterial);
    bulletHoles.frustumCulled = false;
    this.scene.add(bulletHoles);
    this.positionBufferAttribute = new BufferAttribute(this.positionFoat32Array, 3);
    this.normalBufferAttribute = new BufferAttribute(this.normalFoat32Array, 3);
    this.generTimeBufferAttribute = new BufferAttribute(this.generTimeFLoat32Array, 1);
    this.randBufferAttribute = new BufferAttribute(this.randFoat32Array, 1);
    this.bulletHoleGeometry.setAttribute("position", this.positionBufferAttribute);
    this.bulletHoleGeometry.setAttribute("normal", this.normalBufferAttribute);
    this.bulletHoleGeometry.setAttribute("generTime", this.generTimeBufferAttribute);
    this.bulletHoleGeometry.setAttribute("rand", this.randBufferAttribute);
    LayerEventPipe.addEventListener(BulletFallenPointEvent.type, (e) => {
      this.addPoint(e.detail.fallenPoint, e.detail.fallenNormal);
    });
  }
  addPoint(point, normal) {
    const random = 0.5 + Math.random() * 0.5;
    this.positionFoat32Array.set(point.toArray(array3Util$4, 0), this.bulletHoleIndex * 3);
    this.normalFoat32Array.set(normal.toArray(array3Util$4, 0), this.bulletHoleIndex * 3);
    array1Util$4[0] = GameContext.GameLoop.Clock.getElapsedTime();
    this.generTimeFLoat32Array.set(array1Util$4, this.bulletHoleIndex);
    array1Util$4[0] = random;
    this.randFoat32Array.set(array1Util$4, this.bulletHoleIndex);
    if (this.bulletHoleIndex + 1 >= this.maximun)
      this.bulletHoleIndex = 0;
    else
      this.bulletHoleIndex += 1;
    this.positionBufferAttribute.needsUpdate = true;
    this.normalBufferAttribute.needsUpdate = true;
    this.generTimeBufferAttribute.needsUpdate = true;
    this.randBufferAttribute.needsUpdate = true;
  }
  callEveryFrame(deltaTime, elapsedTime) {
    this.bulletHoleMaterial.uniforms.uTime.value = elapsedTime;
  }
}

const bulletHoleVertex = "attribute float rand;// 给弹孔随机大小\r\nattribute float generTime;\r\n\r\nuniform float uTime;// 当前时间\r\nuniform float uScale;// 弹孔大小\r\n\r\nvarying float vElapsed;// 传递弹点生成时间\r\nvarying float vRand;\r\n\r\nvoid main()\r\n{\r\n    vRand=rand;\r\n    vElapsed=uTime-generTime;// 已经存在时间\r\n    \r\n    // 计算弹孔点的位置\r\n    vec3 position1=position;\r\n    position1+=normalize(cameraPosition-position)*.01;//朝着相机方向移动(基础)\r\n    position1+=normal*.01;// 朝着命中的面的法线方向移动\r\n    gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position1,1.);// 点位置\r\n    \r\n    // 计算弹孔点的大小\r\n    \r\n    gl_PointSize=32.;// 弹孔默认大小\r\n    gl_PointSize+=(48.*rand);// 弹孔默认大小受到随机值影响后的值\r\n    gl_PointSize*=uScale;// 点大小受到uniform自定义值影响\r\n    vec4 viewPosition=viewMatrix*vec4(position1,1.);\r\n    gl_PointSize*=(1./-viewPosition.z);// 点大小受到距离远近影响\r\n    \r\n}";

const bulletHoleFrag = "uniform float uOpacity;\r\nuniform float uExitTime;\r\nuniform float uFadeTime;// 渐变消失时间\r\nuniform sampler2D uBulletHoleT;\r\n\r\nvarying float vElapsed;// 传递弹点生成时间\r\nvarying float vRand;// [.5,1.]\r\n\r\nvoid main()\r\n{\r\n    \r\n    float fadeMask=step(uExitTime,vElapsed);// 开始渐变消失为1\r\n    fadeMask*=(vElapsed-uExitTime)/uFadeTime;\r\n    \r\n    // 性能优化\r\n    \r\n    if(uOpacity-fadeMask<0.){\r\n        discard;\r\n    }\r\n    \r\n    // 利用随机数显示4种弹孔其中的一种\r\n    \r\n    vec2 pointCoord=gl_PointCoord/2.;\r\n    pointCoord.x+=.5;\r\n    pointCoord.y+=.5;\r\n    float index=floor(vRand/.125);// [4, 8]\r\n    if(index==4.){\r\n        pointCoord.x-=.5;\r\n        pointCoord.y-=.5;\r\n    }else if(index==5.){\r\n        pointCoord.y-=.5;\r\n    }else if(index==6.){\r\n        pointCoord.x-=.5;\r\n    }\r\n    vec4 temp=texture2D(uBulletHoleT,pointCoord);\r\n    \r\n    // gl_FragColor=vec4(vec3(0.),uOpacity-fadeMask);\r\n    gl_FragColor=vec4(temp.rgb,(uOpacity-fadeMask)*temp.a);\r\n    \r\n}";

const pointTexture = "data:image/png;base64,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";

const image$3 = new Image();
const texture$3 = new Texture(image$3);
image$3.src = pointTexture;
image$3.onload = () => {
  texture$3.needsUpdate = true;
};
const array3Util$3 = new Array(3);
const array1Util$3 = new Array(1);
class BulletHoleLayer {
  scene;
  maximun = 40;
  bulletHoleOpacity = 0.8;
  bulletHoleScale = 1.5;
  exitTime = 5;
  fadeTime = 0.5;
  bulletHoleGeometry = new BufferGeometry();
  bulletHoleMaterial = new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: this.bulletHoleOpacity },
      uScale: { value: this.bulletHoleScale },
      uExitTime: { value: this.exitTime },
      uFadeTime: { value: this.fadeTime },
      uBulletHoleT: { value: texture$3 }
    },
    blending: CustomBlending,
    depthWrite: false,
    transparent: true,
    vertexShader: bulletHoleVertex,
    fragmentShader: bulletHoleFrag
  });
  positionFoat32Array;
  normalFoat32Array;
  generTimeFLoat32Array;
  randFoat32Array;
  positionBufferAttribute;
  normalBufferAttribute;
  generTimeBufferAttribute;
  randBufferAttribute;
  bulletHoleIndex = 0;
  init() {
    this.scene = GameContext.Scenes.Sprites;
    this.positionFoat32Array = new Float32Array(new ArrayBuffer(4 * 3 * this.maximun));
    this.normalFoat32Array = new Float32Array(new ArrayBuffer(4 * 3 * this.maximun));
    this.generTimeFLoat32Array = new Float32Array(new ArrayBuffer(4 * this.maximun));
    this.randFoat32Array = new Float32Array(new ArrayBuffer(4 * this.maximun));
    for (let i = 0; i < this.maximun; i++) {
      array1Util$3[0] = -10;
      this.generTimeFLoat32Array.set(array1Util$3, i);
    }
    this.positionBufferAttribute = new BufferAttribute(this.positionFoat32Array, 3);
    this.normalBufferAttribute = new BufferAttribute(this.normalFoat32Array, 3);
    this.generTimeBufferAttribute = new BufferAttribute(this.generTimeFLoat32Array, 1);
    this.randBufferAttribute = new BufferAttribute(this.randFoat32Array, 1);
    this.bulletHoleGeometry.setAttribute("position", this.positionBufferAttribute);
    this.bulletHoleGeometry.setAttribute("normal", this.normalBufferAttribute);
    this.bulletHoleGeometry.setAttribute("generTime", this.generTimeBufferAttribute);
    this.bulletHoleGeometry.setAttribute("rand", this.randBufferAttribute);
    const bulletHoles = new Points(this.bulletHoleGeometry, this.bulletHoleMaterial);
    bulletHoles.frustumCulled = false;
    this.scene.add(bulletHoles);
    LayerEventPipe.addEventListener(BulletFallenPointEvent.type, (e) => {
      this.addPoint(e.detail.fallenPoint, e.detail.fallenNormal);
    });
  }
  addPoint(point, normal) {
    const random = 0.5 + Math.random() * 0.5;
    this.positionFoat32Array.set(point.toArray(array3Util$3, 0), this.bulletHoleIndex * 3);
    this.positionBufferAttribute.needsUpdate = true;
    this.normalFoat32Array.set(normal.toArray(array3Util$3, 0), this.bulletHoleIndex * 3);
    this.normalBufferAttribute.needsUpdate = true;
    array1Util$3[0] = GameContext.GameLoop.Clock.getElapsedTime();
    this.generTimeFLoat32Array.set(array1Util$3, this.bulletHoleIndex);
    this.generTimeBufferAttribute.needsUpdate = true;
    array1Util$3[0] = random;
    this.randFoat32Array.set(array1Util$3, this.bulletHoleIndex);
    this.randBufferAttribute.needsUpdate = true;
    if (this.bulletHoleIndex + 1 >= this.maximun)
      this.bulletHoleIndex = 0;
    else
      this.bulletHoleIndex += 1;
  }
  callEveryFrame(deltaTime, elapsedTime) {
    this.bulletHoleMaterial.uniforms.uTime.value = elapsedTime;
  }
}

/**
 * Based on "A Practical Analytic Model for Daylight"
 * aka The Preetham Model, the de facto standard analytic skydome model
 * https://www.researchgate.net/publication/220720443_A_Practical_Analytic_Model_for_Daylight
 *
 * First implemented by Simon Wallner
 * http://simonwallner.at/project/atmospheric-scattering/
 *
 * Improved by Martin Upitis
 * http://blenderartists.org/forum/showthread.php?245954-preethams-sky-impementation-HDR
 *
 * Three.js integration by zz85 http://twitter.com/blurspline
*/

class Sky extends Mesh {

	constructor() {

		const shader = Sky.SkyShader;

		const material = new ShaderMaterial( {
			name: 'SkyShader',
			fragmentShader: shader.fragmentShader,
			vertexShader: shader.vertexShader,
			uniforms: UniformsUtils.clone( shader.uniforms ),
			side: BackSide,
			depthWrite: false
		} );

		super( new BoxGeometry( 1, 1, 1 ), material );

		this.isSky = true;

	}

}

Sky.SkyShader = {

	uniforms: {
		'turbidity': { value: 2 },
		'rayleigh': { value: 1 },
		'mieCoefficient': { value: 0.005 },
		'mieDirectionalG': { value: 0.8 },
		'sunPosition': { value: new Vector3() },
		'up': { value: new Vector3( 0, 1, 0 ) }
	},

	vertexShader: /* glsl */`
		uniform vec3 sunPosition;
		uniform float rayleigh;
		uniform float turbidity;
		uniform float mieCoefficient;
		uniform vec3 up;

		varying vec3 vWorldPosition;
		varying vec3 vSunDirection;
		varying float vSunfade;
		varying vec3 vBetaR;
		varying vec3 vBetaM;
		varying float vSunE;

		// constants for atmospheric scattering
		const float e = 2.71828182845904523536028747135266249775724709369995957;
		const float pi = 3.141592653589793238462643383279502884197169;

		// wavelength of used primaries, according to preetham
		const vec3 lambda = vec3( 680E-9, 550E-9, 450E-9 );
		// this pre-calcuation replaces older TotalRayleigh(vec3 lambda) function:
		// (8.0 * pow(pi, 3.0) * pow(pow(n, 2.0) - 1.0, 2.0) * (6.0 + 3.0 * pn)) / (3.0 * N * pow(lambda, vec3(4.0)) * (6.0 - 7.0 * pn))
		const vec3 totalRayleigh = vec3( 5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5 );

		// mie stuff
		// K coefficient for the primaries
		const float v = 4.0;
		const vec3 K = vec3( 0.686, 0.678, 0.666 );
		// MieConst = pi * pow( ( 2.0 * pi ) / lambda, vec3( v - 2.0 ) ) * K
		const vec3 MieConst = vec3( 1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14 );

		// earth shadow hack
		// cutoffAngle = pi / 1.95;
		const float cutoffAngle = 1.6110731556870734;
		const float steepness = 1.5;
		const float EE = 1000.0;

		float sunIntensity( float zenithAngleCos ) {
			zenithAngleCos = clamp( zenithAngleCos, -1.0, 1.0 );
			return EE * max( 0.0, 1.0 - pow( e, -( ( cutoffAngle - acos( zenithAngleCos ) ) / steepness ) ) );
		}

		vec3 totalMie( float T ) {
			float c = ( 0.2 * T ) * 10E-18;
			return 0.434 * c * MieConst;
		}

		void main() {

			vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
			vWorldPosition = worldPosition.xyz;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			gl_Position.z = gl_Position.w; // set z to camera.far

			vSunDirection = normalize( sunPosition );

			vSunE = sunIntensity( dot( vSunDirection, up ) );

			vSunfade = 1.0 - clamp( 1.0 - exp( ( sunPosition.y / 450000.0 ) ), 0.0, 1.0 );

			float rayleighCoefficient = rayleigh - ( 1.0 * ( 1.0 - vSunfade ) );

			// extinction (absorbtion + out scattering)
			// rayleigh coefficients
			vBetaR = totalRayleigh * rayleighCoefficient;

			// mie coefficients
			vBetaM = totalMie( turbidity ) * mieCoefficient;

		}`,

	fragmentShader: /* glsl */`
		varying vec3 vWorldPosition;
		varying vec3 vSunDirection;
		varying float vSunfade;
		varying vec3 vBetaR;
		varying vec3 vBetaM;
		varying float vSunE;

		uniform float mieDirectionalG;
		uniform vec3 up;

		const vec3 cameraPos = vec3( 0.0, 0.0, 0.0 );

		// constants for atmospheric scattering
		const float pi = 3.141592653589793238462643383279502884197169;

		const float n = 1.0003; // refractive index of air
		const float N = 2.545E25; // number of molecules per unit volume for air at 288.15K and 1013mb (sea level -45 celsius)

		// optical length at zenith for molecules
		const float rayleighZenithLength = 8.4E3;
		const float mieZenithLength = 1.25E3;
		// 66 arc seconds -> degrees, and the cosine of that
		const float sunAngularDiameterCos = 0.999956676946448443553574619906976478926848692873900859324;

		// 3.0 / ( 16.0 * pi )
		const float THREE_OVER_SIXTEENPI = 0.05968310365946075;
		// 1.0 / ( 4.0 * pi )
		const float ONE_OVER_FOURPI = 0.07957747154594767;

		float rayleighPhase( float cosTheta ) {
			return THREE_OVER_SIXTEENPI * ( 1.0 + pow( cosTheta, 2.0 ) );
		}

		float hgPhase( float cosTheta, float g ) {
			float g2 = pow( g, 2.0 );
			float inverse = 1.0 / pow( 1.0 - 2.0 * g * cosTheta + g2, 1.5 );
			return ONE_OVER_FOURPI * ( ( 1.0 - g2 ) * inverse );
		}

		void main() {

			vec3 direction = normalize( vWorldPosition - cameraPos );

			// optical length
			// cutoff angle at 90 to avoid singularity in next formula.
			float zenithAngle = acos( max( 0.0, dot( up, direction ) ) );
			float inverse = 1.0 / ( cos( zenithAngle ) + 0.15 * pow( 93.885 - ( ( zenithAngle * 180.0 ) / pi ), -1.253 ) );
			float sR = rayleighZenithLength * inverse;
			float sM = mieZenithLength * inverse;

			// combined extinction factor
			vec3 Fex = exp( -( vBetaR * sR + vBetaM * sM ) );

			// in scattering
			float cosTheta = dot( direction, vSunDirection );

			float rPhase = rayleighPhase( cosTheta * 0.5 + 0.5 );
			vec3 betaRTheta = vBetaR * rPhase;

			float mPhase = hgPhase( cosTheta, mieDirectionalG );
			vec3 betaMTheta = vBetaM * mPhase;

			vec3 Lin = pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * ( 1.0 - Fex ), vec3( 1.5 ) );
			Lin *= mix( vec3( 1.0 ), pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * Fex, vec3( 1.0 / 2.0 ) ), clamp( pow( 1.0 - dot( up, vSunDirection ), 5.0 ), 0.0, 1.0 ) );

			// nightsky
			float theta = acos( direction.y ); // elevation --> y-axis, [-pi/2, pi/2]
			float phi = atan( direction.z, direction.x ); // azimuth --> x-axis [-pi/2, pi/2]
			vec2 uv = vec2( phi, theta ) / vec2( 2.0 * pi, pi ) + vec2( 0.5, 0.0 );
			vec3 L0 = vec3( 0.1 ) * Fex;

			// composition + solar disc
			float sundisk = smoothstep( sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta );
			L0 += ( vSunE * 19000.0 * Fex ) * sundisk;

			vec3 texColor = ( Lin + L0 ) * 0.04 + vec3( 0.0, 0.0003, 0.00075 );

			vec3 retColor = pow( texColor, vec3( 1.0 / ( 1.2 + ( 1.2 * vSunfade ) ) ) );

			gl_FragColor = vec4( retColor, 1.0 );

			#include <tonemapping_fragment>
			#include <encodings_fragment>

		}`

};

const skyEffectConfig = {
  turbidity: 4,
  rayleigh: 1,
  mieCoefficient: 3e-3,
  mieDirectionalG: 0.7,
  elevation: 20,
  azimuth: -10,
  exposure: GameContext.GameView.Renderer.toneMappingExposure
};
class SkyLayer {
  scene;
  sky = new Sky();
  sun = new Vector3();
  init() {
    this.scene = GameContext.Scenes.Skybox;
    this.sky.scale.setScalar(1e3);
    const uniforms = this.sky.material.uniforms;
    uniforms["turbidity"].value = skyEffectConfig.turbidity;
    uniforms["rayleigh"].value = skyEffectConfig.rayleigh;
    uniforms["mieCoefficient"].value = skyEffectConfig.mieCoefficient;
    uniforms["mieDirectionalG"].value = skyEffectConfig.mieDirectionalG;
    const phi = MathUtils.degToRad(90 - skyEffectConfig.elevation);
    const theta = MathUtils.degToRad(skyEffectConfig.azimuth);
    this.sun.setFromSphericalCoords(1, phi, theta);
    uniforms["sunPosition"].value.copy(this.sun);
    GameContext.GameView.Renderer.toneMappingExposure = skyEffectConfig.exposure;
    this.scene.add(this.sky);
  }
}

const upVert = "uniform float uSize;\r\nuniform float uThinkness;\r\nuniform float uGap;\r\nuniform float uAspect;\r\n\r\nmat4 scale(float x,float y,float z)\r\n{\r\n    return mat4(\r\n        x,0,0,0,\r\n        0,y,0,0,\r\n        0,0,z,0,\r\n        0,0,0,1\r\n    );\r\n}\r\n\r\nmat4 translate(float x,float y,float z)\r\n{\r\n    return mat4(\r\n        1,0,0,0,\r\n        0,1,0,0,\r\n        0,0,1,0,\r\n        x,y,z,1\r\n    );\r\n}\r\n\r\nvoid main(){\r\n    \r\n    mat4 withoutAspect=scale(1.,uAspect,1.);// 缩放y轴, 去除浏览器aspect影响\r\n    mat4 thinknessAndSize=scale(uThinkness,uSize,1.);// 应用长短粗细\r\n    mat4 crossIndex=translate(0.,uSize/2.,0.);// 向上位移1个准星长度\r\n    mat4 crossGap=translate(0.,uGap,0.);// gap变换\r\n    \r\n    // projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.); // 由于使用了正交相机因此不用mvp\r\n    gl_Position=crossGap*crossIndex*thinknessAndSize*vec4(position,1.);\r\n    \r\n}";

const downVert = "uniform float uSize;\r\nuniform float uThinkness;\r\nuniform float uGap;\r\nuniform float uAspect;\r\n\r\nmat4 scale(float x,float y,float z)\r\n{\r\n    return mat4(\r\n        x,0,0,0,\r\n        0,y,0,0,\r\n        0,0,z,0,\r\n        0,0,0,1\r\n    );\r\n}\r\n\r\nmat4 translate(float x,float y,float z)\r\n{\r\n    return mat4(\r\n        1,0,0,0,\r\n        0,1,0,0,\r\n        0,0,1,0,\r\n        x,y,z,1\r\n    );\r\n}\r\n\r\nmat4 makeRotationZ(float angle)\r\n{\r\n    return mat4(\r\n        cos(angle),-sin(angle),0,0,\r\n        sin(angle),cos(angle),0,0,\r\n        0,0,1,0,\r\n        0,0,0,1\r\n    );\r\n}\r\n\r\nvoid main(){\r\n    \r\n    mat4 withoutAspect=scale(1.,uAspect,1.);// 缩放y轴, 去除浏览器aspect影响\r\n    mat4 thinknessAndSize=scale(uThinkness,uSize,1.);// 应用长短粗细\r\n    mat4 crossIndex=translate(0.,-uSize/2.,0.);// 向上位移1个准星长度\r\n    mat4 crossGap=translate(0.,-uGap,0.);// gap变换\r\n    \r\n    // projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.); // 由于使用了正交相机因此不用mvp\r\n    gl_Position=crossGap*crossIndex*thinknessAndSize*vec4(position,1.);\r\n    \r\n}\r\n";

const leftVert = "uniform float uSize;\r\nuniform float uThinkness;\r\nuniform float uGap;\r\nuniform float uAspect;\r\n\r\nmat4 scale(float x,float y,float z)\r\n{\r\n    return mat4(\r\n        x,0,0,0,\r\n        0,y,0,0,\r\n        0,0,z,0,\r\n        0,0,0,1\r\n    );\r\n}\r\n\r\nmat4 translate(float x,float y,float z)\r\n{\r\n    return mat4(\r\n        1,0,0,0,\r\n        0,1,0,0,\r\n        0,0,1,0,\r\n        x,y,z,1\r\n    );\r\n}\r\n\r\nmat4 makeRotationZ(float angle)\r\n{\r\n    return mat4(\r\n        cos(angle),-sin(angle),0,0,\r\n        sin(angle),cos(angle),0,0,\r\n        0,0,1,0,\r\n        0,0,0,1\r\n    );\r\n}\r\n\r\nvoid main(){\r\n    \r\n    float PI=3.141592653589793;\r\n    \r\n    mat4 withoutAspect=scale(1./uAspect,uAspect,1.);// 缩放y轴, 去除浏览器aspect影响\r\n    mat4 thinknessAndSize=scale(uThinkness,uSize,1.);// 应用长短粗细\r\n    mat4 crossLeft=makeRotationZ(-PI/2.);// 左转90\r\n    mat4 crossIndex=translate(-uSize/2.,0.,0.);// 向左平移1个准星长度\r\n    mat4 crossGap=translate(-uGap,0.,0.);// gap变换\r\n    \r\n    // projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.); // 由于使用了正交相机因此不用mvp\r\n    gl_Position=withoutAspect*crossGap*crossIndex*crossLeft*thinknessAndSize*vec4(position,1.);\r\n    \r\n}";

const rightVert = "uniform float uSize;\r\nuniform float uThinkness;\r\nuniform float uGap;\r\nuniform float uAspect;\r\n\r\nmat4 scale(float x,float y,float z)\r\n{\r\n    return mat4(\r\n        x,0,0,0,\r\n        0,y,0,0,\r\n        0,0,z,0,\r\n        0,0,0,1\r\n    );\r\n}\r\n\r\nmat4 translate(float x,float y,float z)\r\n{\r\n    return mat4(\r\n        1,0,0,0,\r\n        0,1,0,0,\r\n        0,0,1,0,\r\n        x,y,z,1\r\n    );\r\n}\r\n\r\nmat4 makeRotationZ(float angle)\r\n{\r\n    return mat4(\r\n        cos(angle),-sin(angle),0,0,\r\n        sin(angle),cos(angle),0,0,\r\n        0,0,1,0,\r\n        0,0,0,1\r\n    );\r\n}\r\n\r\nvoid main(){\r\n    \r\n    float PI=3.141592653589793;\r\n    \r\n    mat4 withoutAspect=scale(1./uAspect,uAspect,1.);// 缩放y轴, 去除浏览器aspect影响\r\n    mat4 thinknessAndSize=scale(uThinkness,uSize,1.);// 应用长短粗细\r\n    mat4 crossLeft=makeRotationZ(PI/2.);// 左转90\r\n    mat4 crossIndex=translate(uSize/2.,0.,0.);// 向右平移1个准星长度\r\n    mat4 crossGap=translate(uGap,0.,0.);// gap变换\r\n    \r\n    // projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.); // 由于使用了正交相机因此不用mvp\r\n    gl_Position=withoutAspect*crossGap*crossIndex*crossLeft*thinknessAndSize*vec4(position,1.);\r\n    \r\n}";

const crossFrag = "uniform vec3 uColor;\r\nuniform float uAlpha;\r\n\r\nvoid main(){\r\n    \r\n    gl_FragColor=vec4(uColor,uAlpha);\r\n    \r\n}";

const indexes = new Uint16Array([0, 2, 1, 2, 3, 1]);
const normals = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]);
const positions = new Float32Array([-0.5, 0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 0]);
const geom = new BufferGeometry();
class CrosshairLayer {
  scene;
  camera;
  crossMaterials = [];
  crosshaircolor = new Color(0, 1, 0);
  crosshairsize = 0.02;
  crosshairthinkness = 4e-3;
  crosshairalpha = 0.8;
  crosshairdot = false;
  crosshairgap = 0.01;
  crosshairstyle = 4;
  uniforms;
  init() {
    this.scene = GameContext.Scenes.UI;
    this.uniforms = {
      uColor: { value: this.crosshaircolor },
      uSize: { value: this.crosshairsize },
      uThinkness: { value: this.crosshairthinkness },
      uGap: { value: this.crosshairgap },
      uAlpha: { value: this.crosshairalpha },
      uAspect: { value: GameContext.Cameras.PlayerCamera.aspect }
    };
    const crossMaterial1 = new ShaderMaterial({ uniforms: this.uniforms, vertexShader: upVert, fragmentShader: crossFrag });
    const crossMaterial2 = new ShaderMaterial({ uniforms: this.uniforms, vertexShader: downVert, fragmentShader: crossFrag });
    const crossMaterial3 = new ShaderMaterial({ uniforms: this.uniforms, vertexShader: leftVert, fragmentShader: crossFrag });
    const crossMaterial4 = new ShaderMaterial({ uniforms: this.uniforms, vertexShader: rightVert, fragmentShader: crossFrag });
    window.addEventListener("resize", () => {
      crossMaterial1.uniforms.uAspect.value = GameContext.Cameras.PlayerCamera.aspect;
      crossMaterial2.uniforms.uAspect.value = GameContext.Cameras.PlayerCamera.aspect;
      crossMaterial3.uniforms.uAspect.value = GameContext.Cameras.PlayerCamera.aspect;
      crossMaterial4.uniforms.uAspect.value = GameContext.Cameras.PlayerCamera.aspect;
    });
    geom.setIndex(new BufferAttribute(indexes, 1));
    geom.setAttribute("position", new BufferAttribute(positions, 3));
    geom.setAttribute("normal", new BufferAttribute(normals, 3));
    const cross1 = new Mesh(geom, crossMaterial1);
    const cross2 = new Mesh(geom, crossMaterial2);
    const cross3 = new Mesh(geom, crossMaterial3);
    const cross4 = new Mesh(geom, crossMaterial4);
    this.scene.add(cross1);
    this.scene.add(cross2);
    this.scene.add(cross3);
    this.scene.add(cross4);
    this.crossMaterials.push(crossMaterial1);
    this.crossMaterials.push(crossMaterial2);
    this.crossMaterials.push(crossMaterial3);
    this.crossMaterials.push(crossMaterial4);
    this.crossMaterials.forEach((item) => {
      item.blending = CustomBlending;
      item.side = DoubleSide;
      item.dithering = true;
      item.transparent = true;
    });
  }
  setGap(gapSize) {
    if (this.uniforms["uGap"])
      this.uniforms["uGap"].value = gapSize;
  }
}

let deltaZUtil = 0;
let deltaYUtil = 0;
let screenMoveX = 0;
let screenMoveY = 0;
let mouseFloatX = 0.08;
let mouseFloatY = 0.12;
let breathFloatScale = 0.01;
let cameraDefaultPosition = new Vector3();
class HandModelLayer {
  scene;
  camera;
  localPlayer = LocalPlayer.getInstance();
  animationMixer;
  init() {
    this.scene = GameContext.Scenes.Handmodel;
    DomEventPipe.addEventListener(PointLockEvent.type, function(e) {
      if (e.detail.enum === PointLockEventEnum.MOUSEMOVE) {
        screenMoveX = MathUtils.clamp(screenMoveX + e.detail.movementX, -256, 256);
        screenMoveY = MathUtils.clamp(screenMoveY + e.detail.movementY, -256, 256);
      }
    });
    this.initCameraStatus();
    this.addHandMesh();
  }
  callEveryFrame(deltaTime, elapsedTime) {
    if (this.animationMixer)
      this.animationMixer.update(deltaTime);
    if (!GameContext.PointLock.isLocked)
      return;
    deltaZUtil = 0;
    deltaYUtil = 0;
    const cameraDeltaZ = MathUtils.mapLinear(screenMoveX, -256, 256, -mouseFloatX, mouseFloatX);
    deltaZUtil += cameraDeltaZ;
    const cameraDeltaY = MathUtils.mapLinear(screenMoveY, -256, 256, -mouseFloatY, mouseFloatY);
    deltaYUtil += cameraDeltaY;
    const sinDeltaTime = (Math.sin(elapsedTime) + 1) / 2;
    const breathDelta = MathUtils.lerp(-breathFloatScale, breathFloatScale, sinDeltaTime);
    deltaYUtil += breathDelta;
    this.camera.position.z = cameraDefaultPosition.z + deltaZUtil;
    this.camera.position.y = cameraDefaultPosition.y - deltaYUtil;
    const base = deltaTime;
    if (screenMoveX > 0)
      screenMoveX = Math.min(0, screenMoveX - base);
    else if (screenMoveX < 0)
      screenMoveX = Math.max(0, screenMoveX + base);
    if (screenMoveY > 0)
      screenMoveY = Math.min(0, screenMoveY - base);
    else if (screenMoveY < 0)
      screenMoveY = Math.max(0, screenMoveY + base);
  }
  initCameraStatus() {
    this.camera = GameContext.Cameras.HandModelCamera;
    this.camera.clearViewOffset();
    this.camera.near = 1e-3;
    this.camera.far = 999;
    this.camera.fov = 70;
    this.camera.scale.z = 1.5;
    this.camera.position.set(-1.6, 1.4, 0);
    cameraDefaultPosition.copy(this.camera.position);
    this.camera.rotation.y = -Math.PI / 2;
  }
  addHandMesh() {
    const armature = GameContext.GameResources.resourceMap.get("Armature");
    const arms = GameContext.GameResources.resourceMap.get("Arms");
    arms.material = this.localPlayer.roleMaterial;
    arms.frustumCulled = false;
    this.animationMixer = GameContext.GameResources.resourceMap.get("AnimationMixer");
    arms.visible = true;
    this.scene.add(armature);
    this.scene.add(arms);
  }
}

const bulletShellVert = "\r\nattribute float generTime;\r\nattribute float rand;\r\n\r\nuniform float uTime;\r\nuniform float uScale;\r\n\r\nvarying float vElapsed;\r\nvarying float vRand;\r\n\r\nvoid main(){\r\n    \r\n    float elapsed=uTime-generTime;\r\n    vElapsed=elapsed;\r\n    vRand=rand;\r\n    \r\n    float randFactor=.5+.5*rand;\r\n    float speedFactor=2.;\r\n    float powerFactorVert=2.*randFactor;\r\n    float powerFactorHorize=1.2*randFactor;\r\n    \r\n    vec3 rightVelocity=powerFactorHorize*vec3(0.,0.,1.);// 向右\r\n    vec3 upVelocity=powerFactorVert*vec3(0.,1.,0);// 向上\r\n    vec3 downVelcity=vec3(0,-9.8,-0);// 向下\r\n    \r\n    vec3 position1=position;\r\n    position1+=speedFactor*rightVelocity*elapsed;// 左右分量\r\n    position1+=speedFactor*(upVelocity*elapsed+.5*downVelcity*elapsed*elapsed);// 上下分量\r\n    \r\n    gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position1,1.);\r\n    \r\n    gl_PointSize=32.*uScale;\r\n    gl_PointSize*=(.8+.2*rand);\r\n    vec4 viewPosition=viewMatrix*vec4(position,1.);\r\n    gl_PointSize*=(1./-viewPosition.z);// 点大小受到距离远近影响\r\n    \r\n}";

const bulletShellFrag = "\r\nuniform sampler2D uBulletShellT;\r\nuniform float uDisapperTime;\r\n\r\nvarying float vElapsed;\r\nvarying float vRand;\r\n\r\nmat4 makeRotationZ(float theta)\r\n{\r\n    return mat4(\r\n        cos(theta),-sin(theta),0,0,\r\n        sin(theta),cos(theta),0,0,\r\n        0,0,1,0,\r\n        0,0,0,1\r\n    );\r\n}\r\n\r\nfloat pcurve(float x,float a,float b)\r\n{\r\n    float k=pow(a+b,a+b)/(pow(a,a)*pow(b,b));\r\n    return k*pow(x,a)*pow(1.-x,b);\r\n}\r\n\r\nvoid main(){\r\n    \r\n    if(uDisapperTime>.4){\r\n        discard;\r\n    }\r\n    \r\n    // 旋转\r\n    float rotateRandomFactor=pcurve(vElapsed/uDisapperTime,vRand,vElapsed);\r\n    vec4 randRotate=makeRotationZ(vRand*3.1415926+rotateRandomFactor)*vec4(gl_PointCoord-vec2(.5),0.,1.);// gl.POINTS, (left,top):(0,0) (right, bottom): (1, 1)\r\n    vec4 colorFromT=texture2D(uBulletShellT,randRotate.xy+vec2(.5));// matrix 是用(0, 0)点做中心点进行旋转的\r\n    \r\n    // 不旋转\r\n    // vec4 temp=texture2D(uBulletShellT,gl_PointCoord);\r\n    \r\n    gl_FragColor=colorFromT;\r\n    \r\n}";

const bulletshellTexture = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAABgFBMVEUAAAAkJBwnJx4qKiE1NSktLSM3NysyMiY9PS87Oy4wMCabmns5OS1AQTMwMCU+PjGSkHFpaVVGRjpYWEWEhGhISDgzMycxMSdqaVM3Nys5OTEoKB8mJh5fX0svLycUFA8dHRYREQ4QEA0KCgh3dlygn32JiGs+PTHBv6S6uJ6zsZejooyVlH2JiHZ2dWJsbF5XV0l5eF9jYkxxcFk3NypWVkMpKR9MTENhYUxOTj0hIRlZWUZBQTMoKCAwMCcjIxsrKyEZGRM9PTYcHBZXV0RGRjdPTz4cHBY5OS0jIxsLCwkQEA0KCgjBv5vSz6nIxZ+dm36HhmpUVEKqqIZ1dV53dl7AvperqYeEg2h0c1thYExdXEhQUD+zsIuqp4aopoWUknOLiWyGhGpmZlBjY07Gwpm8upefnn9gYExeXUpSUkFRUUDV0qvNy6PKx6DDwZ/Gw5y1soyjooimpIGBgGd6eWHIxqa9u5+4tZKwroiXlXiGhXF8e2Fvb1hZWUlOTj6dvx0qAAAATXRSTlMAsbCw5LDk5OPjsf3u5eTj/Pz7+eno5NfMyce3paOZlo6BcVX6+fnv7u7u7u7u7u7t6eno5+Lc2czLy8nAv7y1s7GrqKKgn5+WgGtgQ5N14WIAAAEpSURBVDjLY6AikJMy0NPR0tDU1tU3d8KmgJmnrjQgray8qFpQSAqbAmme6JJ4f7/8opJMdTusCkyiI8Jzc/LTS4PYHLApYGQBKsjL8Q0IDWJjxqaAiS06ItjfD7+CeHwKmDkzI+KACtJDg1iYcChIIqAgA6wgIDRLDKcCsCNDstkZyVLAyhEVGA5WEEO5Aj6cCoIJKsBvRUpgcEFuGndINvZwYOUHKvDNq6iKzMIeklz8KYnxYQWFCZFBOBTwJgMVpMbiVRBMSEEcWEEWOyMONwQWp4VVCtTWYw8HGXHhGu7YwuLAZCEzZ2wKFGxFBdW4VQVUhHms5LEpUHKXNDUWETE0EhV3VMSmQFlRxsZaQsLCUtJe3gubAh9vTw83WVkXVzkFJWUS8jQAPttaQ4x+UukAAAAASUVORK5CYII=";

const image$2 = new Image();
const texture$2 = new Texture(image$2);
image$2.src = bulletshellTexture;
image$2.onload = () => {
  texture$2.needsUpdate = true;
};
const array3Util$2 = new Array(3);
const array1Util$2 = new Array(1);
const chamberPositionUtil$1 = new Vector3();
class ChamberBulletShell {
  scene;
  camera;
  ifRender = false;
  maximun = 10;
  bulletShellOpacity = 1;
  bulletShellScale = 1.2;
  bulletShellDisappearTime = 0.4;
  bulletShellsGeometry = new BufferGeometry();
  bulletShellsMaterial = new ShaderMaterial({
    uniforms: {
      uTime: { value: -20 },
      uDisapperTime: { value: this.bulletShellDisappearTime },
      uScale: { value: this.bulletShellScale },
      uOpacity: { value: this.bulletShellOpacity },
      uBulletShellT: { value: texture$2 }
    },
    blending: CustomBlending,
    vertexShader: bulletShellVert,
    fragmentShader: bulletShellFrag
  });
  positionFoat32Array;
  generTimeFLoat32Array;
  randFoat32Array;
  positionBufferAttribute;
  generTimeBufferAttribute;
  randBufferAttribute;
  bulletShellIndex = 0;
  init() {
    this.scene = GameContext.Scenes.Handmodel;
    this.camera = GameContext.Cameras.HandModelCamera;
    const bulletShells = new Points(this.bulletShellsGeometry, this.bulletShellsMaterial);
    bulletShells.frustumCulled = false;
    this.scene.add(bulletShells);
    this.initBuffers();
    GameLogicEventPipe.addEventListener(WeaponEquipEvent.type, (e) => {
      const _weaponInstance = WeaponEquipEvent.detail.weaponInstance;
      if (_weaponInstance && _weaponInstance.chamberPosition) {
        this.ifRender = true;
        chamberPositionUtil$1.copy(_weaponInstance.chamberPosition);
      } else
        this.ifRender = false;
    });
    LayerEventPipe.addEventListener(ShotOutWeaponFireEvent.type, (e) => {
      if (this.ifRender)
        this.render();
    });
  }
  initBuffers() {
    this.positionFoat32Array = new Float32Array(new ArrayBuffer(4 * 3 * this.maximun));
    this.generTimeFLoat32Array = new Float32Array(new ArrayBuffer(4 * this.maximun));
    this.randFoat32Array = new Float32Array(new ArrayBuffer(4 * this.maximun));
    for (let i = 0; i < this.maximun; i++) {
      array1Util$2[0] = -10;
      this.generTimeFLoat32Array.set(array1Util$2, i);
    }
    this.positionBufferAttribute = new BufferAttribute(this.positionFoat32Array, 3);
    this.generTimeBufferAttribute = new BufferAttribute(this.generTimeFLoat32Array, 1);
    this.randBufferAttribute = new BufferAttribute(this.randFoat32Array, 1);
    this.bulletShellsGeometry.setAttribute("position", this.positionBufferAttribute);
    this.bulletShellsGeometry.setAttribute("generTime", this.generTimeBufferAttribute);
    this.bulletShellsGeometry.setAttribute("rand", this.randBufferAttribute);
  }
  render() {
    this.positionFoat32Array.set(chamberPositionUtil$1.toArray(array3Util$2, 0), this.bulletShellIndex * 3);
    this.positionBufferAttribute.needsUpdate = true;
    array1Util$2[0] = GameContext.GameLoop.Clock.getElapsedTime();
    this.generTimeFLoat32Array.set(array1Util$2, this.bulletShellIndex);
    this.generTimeBufferAttribute.needsUpdate = true;
    const random = Math.random();
    array1Util$2[0] = random;
    this.randFoat32Array.set(array1Util$2, this.bulletShellIndex);
    this.randBufferAttribute.needsUpdate = true;
    if (this.bulletShellIndex + 1 >= this.maximun)
      this.bulletShellIndex = 0;
    else
      this.bulletShellIndex += 1;
  }
  callEveryFrame(deltaTime, elapsedTime) {
    this.bulletShellsMaterial.uniforms.uTime.value = elapsedTime;
  }
}

const chamberSmokeVert = "uniform float uTime;\r\nuniform float uSpeed;\r\n\r\nattribute float generTime;\r\nattribute float rand;\r\nattribute vec3 direction;\r\n\r\nvarying float vElapsed;\r\nvarying float vRand;\r\n\r\nvec3 upperDirection=vec3(0,1,0);\r\n\r\nfloat almostIdentity(float x,float n)\r\n{\r\n    return sqrt(x*x+n);\r\n}\r\n\r\nvoid main(){\r\n    \r\n    // 传递变量\r\n    \r\n    float elapsed=uTime-generTime;\r\n    vElapsed=elapsed;\r\n    vRand=rand;\r\n    \r\n    // 计算位置(烟雾处于运动状态)\r\n    \r\n    vec3 position1=position;\r\n    position1+=direction*uSpeed*elapsed;// S = v*t\r\n    position1+=upperDirection*elapsed*(rand*.3+.1);\r\n    \r\n    gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position1,1.);\r\n    \r\n    gl_PointSize=512.;// 烟雾基础大小\r\n    gl_PointSize*=.3*rand+.7;// 烟雾大小需要添加一些随机值看上去更加真实\r\n    gl_PointSize*=almostIdentity(elapsed,1.);// 烟雾扩散(增大点大小)\r\n    vec4 positionViewCoord=viewMatrix*modelMatrix*vec4(position1,1.);\r\n    gl_PointSize*=(1./-positionViewCoord.z);// 点大小受到距离远近影响\r\n    \r\n}";

const chamberSmokeFrag = "\r\nuniform sampler2D uSmokeT;\r\nuniform float uOpacityFactor;\r\n\r\nuniform float uDisappearTime;\r\nuniform float uFadeTime;\r\n\r\nvarying float vElapsed;\r\nvarying float vRand;\r\n\r\n// 我感觉该函数作为淡入淡出的函数非常不错\r\nfloat pcurve(float x,float a,float b)\r\n{\r\n    float k=pow(a+b,a+b)/(pow(a,a)*pow(b,b));\r\n    return k*pow(x,a)*pow(1.-x,b);\r\n}\r\n\r\nmat4 makeRotationZ(float theta)\r\n{\r\n    return mat4(\r\n        cos(theta),-sin(theta),0,0,\r\n        sin(theta),cos(theta),0,0,\r\n        0,0,1,0,\r\n        0,0,0,1\r\n    );\r\n}\r\n\r\nvoid main(){\r\n    \r\n    // shader优化\r\n    \r\n    if(vElapsed>uDisappearTime+uFadeTime){discard;}\r\n    \r\n    vec4 temp=vec4(1.);\r\n    \r\n    // 旋转后取出贴图基本色\r\n    \r\n    vec2 pointCoord=gl_PointCoord;\r\n    pointCoord=pointCoord-vec2(.5);\r\n    vec4 randRotate=makeRotationZ(vRand*3.14)*vec4(pointCoord,0.,1.);\r\n    vec4 colorFromT=texture2D(uSmokeT,randRotate.xy+vec2(.5));\r\n    temp=colorFromT;\r\n    \r\n    // 淡入淡出\r\n    \r\n    float fadeFactor=pcurve(vElapsed,uDisappearTime,uFadeTime);\r\n    \r\n    gl_FragColor=vec4(temp.rgb,temp.a*uOpacityFactor*fadeFactor);\r\n    // gl_FragColor=vec4(vec3(1.),fadeFactor);\r\n    \r\n}";

const smokeTexture = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAMAAAD04JH5AAAAmVBMVEUAAAD////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VHQRUAAAAM3RSTlMABAcxLAsTXFdSI01IDjk1QxdgG4gnaGRsQIOYPX8fjHBzepCclKWgqne0ua6xvcLGytKIhcH1AAAacElEQVR42sSVy07FMAxEG7+ETJyHrCwqRfn/z8RhgWAB3IJ0a6lZtAuPz4yb41ql48ZKwJCibhMBZpIONjhuKhHpBtbtLiO2AO9d1fgWBdx1DKzkuoSP55ctqpUItS8VeDqCZLIqIQUEpdHt2QIg2W49VJXCB+r86OJAHADGDP/Cbwfs7u60wgFClfTIb8N2aAHE+hrE/8m/MztWkpHRbNFQ59/aJxNRUleLAbgTDvurcQDmYhoCVskNg4CL/4wgWbRlYF++lrAsQtzYeme7ukIS+FbfAlRHy3kWpCVd4Ef48X27z6rejb3mk9BNCesSu5R+HwGcaGkpNDC3NoMEKQN8Dz/om7j2bf1wd6NWmlLB0F6qX9ph8/UeeyqzlllanrUiDZIvAj5fUCAW5MW7YvCnSvUs7SzzPHMZGi9QLmQhiet76uM5Y/j5MrXijoF8vhQTc/qAv21XDQk4FrXXHNO/xhnwCs5CMY88DuCN8jLbjRSGguh023jHC4wxjgiJWpqH/P8PzjHRSPMYnKizNPiWq+rWbYorKwJg5hr7IWS3HTZELbjpv/qYbvr++VC1crl0Ra0QJ2zTtgdjQ7AhZWPiCoD55/5XihGcqC1ThnyaAE5Fco7//4uoa0yspPMYlvPqYCBF2k9wW9d6UJ/QzpoADFGEKM8fC0CCzcqJo8eEht3aLp1gwUhR36yjxAObwIqr60zDnWdB/oppgvfGcCeacTsHwEYJC0836iu2lMP2R4ydDQEgvwGsSk3XRWWYRIbQk2DrVThsT8PGwPW22SSOxIo9nmwUcVO58QmIZudMgg3ogCNDqTxrEiBCYuShS0WwvUpvcw5cBTTI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";

const v3Util = new Vector3();
const cameraLookAt = new Vector3(0, 0, -1);
const cameraUp = new Vector3(0, 1, 0);
const chamberPositionUtil = new Vector3();
const muzzlePositionUtil$1 = new Vector3();
class WeaponComponentsPositionUtil {
  static instance;
  static getInstance() {
    if (!WeaponComponentsPositionUtil.instance)
      WeaponComponentsPositionUtil.instance = new WeaponComponentsPositionUtil();
    return WeaponComponentsPositionUtil.instance;
  }
  handModelCamera = GameContext.Cameras.HandModelCamera;
  playerCamera = GameContext.Cameras.PlayerCamera;
  chamberFrontDelta = 0;
  chamberRightDelta = 0;
  chamberDownDelta = 0;
  muzzleFrontDelta = 0;
  muzzleRightDelta = 0;
  muzzleDownDelta = 0;
  frontDirection = new Vector3();
  rightDirection = new Vector3();
  downDirection = new Vector3();
  constructor() {
    GameLogicEventPipe.addEventListener(WeaponEquipEvent.type, (e) => {
      const _weaponInstance = WeaponEquipEvent.detail.weaponInstance;
      if (_weaponInstance && _weaponInstance.chamberPosition) {
        v3Util.copy(_weaponInstance.chamberPosition);
        this.chamberFrontDelta = v3Util.x - this.handModelCamera.position.x;
        this.chamberRightDelta = v3Util.z - this.handModelCamera.position.z;
        this.chamberDownDelta = v3Util.y - this.handModelCamera.position.y;
      }
      if (_weaponInstance && _weaponInstance.muzzlePosition) {
        v3Util.copy(_weaponInstance.muzzlePosition);
        this.muzzleFrontDelta = v3Util.x - this.handModelCamera.position.x;
        this.muzzleRightDelta = v3Util.z - this.handModelCamera.position.z;
        this.muzzleDownDelta = v3Util.y - this.handModelCamera.position.y;
      }
    });
  }
  calculateChamberPosition() {
    v3Util.copy(cameraLookAt);
    v3Util.applyEuler(this.playerCamera.rotation);
    v3Util.normalize();
    this.frontDirection.copy(v3Util);
    v3Util.copy(cameraUp);
    v3Util.applyEuler(this.playerCamera.rotation);
    v3Util.normalize();
    this.downDirection.copy(v3Util);
    v3Util.copy(this.frontDirection);
    v3Util.cross(this.downDirection);
    v3Util.normalize();
    this.rightDirection.copy(v3Util);
    chamberPositionUtil.copy(this.playerCamera.position);
    chamberPositionUtil.addScaledVector(this.frontDirection, this.chamberFrontDelta);
    chamberPositionUtil.addScaledVector(this.rightDirection, this.chamberRightDelta);
    chamberPositionUtil.addScaledVector(this.downDirection, this.chamberDownDelta);
    return chamberPositionUtil;
  }
  calculateMuzzlePosition() {
    v3Util.copy(cameraLookAt);
    v3Util.applyEuler(this.playerCamera.rotation);
    v3Util.normalize();
    this.frontDirection.copy(v3Util);
    v3Util.copy(cameraUp);
    v3Util.applyEuler(this.playerCamera.rotation);
    v3Util.normalize();
    this.downDirection.copy(v3Util);
    v3Util.copy(this.frontDirection);
    v3Util.cross(this.downDirection);
    v3Util.normalize();
    this.rightDirection.copy(v3Util);
    muzzlePositionUtil$1.copy(this.playerCamera.position);
    muzzlePositionUtil$1.addScaledVector(this.frontDirection, this.muzzleFrontDelta);
    muzzlePositionUtil$1.addScaledVector(this.rightDirection, this.muzzleRightDelta);
    muzzlePositionUtil$1.addScaledVector(this.downDirection, this.muzzleDownDelta);
    return muzzlePositionUtil$1;
  }
}

const image$1 = new Image();
const texture$1 = new Texture(image$1);
image$1.src = smokeTexture;
image$1.onload = () => {
  texture$1.needsUpdate = true;
};
const array3Util$1 = new Array(3);
const array1Util$1 = new Array(1);
class ChamberSmokeLayer {
  ifRender = false;
  scene;
  camera;
  handModelCamera;
  maximun = 20 * 2;
  weaponComponentsPositionUtil;
  chamberSmokeOpacityFactor = 0.1;
  chamberSmokeDisapperTime = 1;
  chamberSmokeFadeTime = 1.5;
  chamberSmokeScale = 1.5;
  chamberSmokeSpeed = 0.2;
  chamberSmokeDisappearTime = 0.4;
  chamberSmokeGeometry = new BufferGeometry();
  chamberSmokeSM = new ShaderMaterial({
    transparent: true,
    blending: AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uSmokeT: { value: texture$1 },
      uOpacityFactor: { value: this.chamberSmokeOpacityFactor },
      uDisappearTime: { value: this.chamberSmokeDisapperTime },
      uSpeed: { value: this.chamberSmokeSpeed },
      uFadeTime: { value: this.chamberSmokeFadeTime },
      uScale: { value: this.chamberSmokeScale },
      uDisapperTime: { value: this.chamberSmokeDisappearTime }
    },
    depthWrite: false,
    vertexShader: chamberSmokeVert,
    fragmentShader: chamberSmokeFrag
  });
  positionFoat32Array;
  directionFloat32Array;
  generTimeFLoat32Array;
  randFoat32Array;
  positionBufferAttribute;
  directionBufferAttribute;
  generTimeBufferAttribute;
  randBufferAttribute;
  chamberSmokeIndex = 0;
  init() {
    this.scene = GameContext.Scenes.Sprites;
    this.camera = GameContext.Cameras.PlayerCamera;
    this.handModelCamera = GameContext.Cameras.HandModelCamera;
    const chamberSmokes = new Points(this.chamberSmokeGeometry, this.chamberSmokeSM);
    chamberSmokes.frustumCulled = false;
    this.scene.add(chamberSmokes);
    this.initBuffers();
    this.listenChamberPosition();
    LayerEventPipe.addEventListener(ShotOutWeaponFireEvent.type, (e) => {
      if (this.ifRender)
        this.render();
    });
  }
  initBuffers() {
    this.positionFoat32Array = new Float32Array(new ArrayBuffer(4 * 3 * this.maximun));
    this.directionFloat32Array = new Float32Array(new ArrayBuffer(4 * 3 * this.maximun));
    this.generTimeFLoat32Array = new Float32Array(new ArrayBuffer(4 * this.maximun));
    this.randFoat32Array = new Float32Array(new ArrayBuffer(4 * this.maximun));
    for (let i = 0; i < this.maximun; i++) {
      array1Util$1[0] = -10;
      this.generTimeFLoat32Array.set(array1Util$1, i);
    }
    this.positionBufferAttribute = new BufferAttribute(this.positionFoat32Array, 3);
    this.directionBufferAttribute = new BufferAttribute(this.directionFloat32Array, 3);
    this.generTimeBufferAttribute = new BufferAttribute(this.generTimeFLoat32Array, 1);
    this.randBufferAttribute = new BufferAttribute(this.randFoat32Array, 1);
    this.chamberSmokeGeometry.setAttribute("position", this.positionBufferAttribute);
    this.chamberSmokeGeometry.setAttribute("direction", this.directionBufferAttribute);
    this.chamberSmokeGeometry.setAttribute("generTime", this.generTimeBufferAttribute);
    this.chamberSmokeGeometry.setAttribute("rand", this.randBufferAttribute);
  }
  listenChamberPosition() {
    this.weaponComponentsPositionUtil = WeaponComponentsPositionUtil.getInstance();
    GameLogicEventPipe.addEventListener(WeaponEquipEvent.type, (e) => {
      const _weaponInstance = WeaponEquipEvent.detail.weaponInstance;
      if (_weaponInstance && _weaponInstance.chamberPosition)
        this.ifRender = true;
      else
        this.ifRender = false;
    });
  }
  render() {
    this.positionFoat32Array.set(
      this.weaponComponentsPositionUtil.calculateChamberPosition().toArray(array3Util$1, 0),
      this.chamberSmokeIndex * 3
    );
    this.positionBufferAttribute.needsUpdate = true;
    const rightDirection = this.weaponComponentsPositionUtil.rightDirection;
    this.directionFloat32Array.set(
      rightDirection.toArray(array3Util$1, 0),
      this.chamberSmokeIndex * 3
    );
    this.directionBufferAttribute.needsUpdate = true;
    array1Util$1[0] = GameContext.GameLoop.Clock.getElapsedTime();
    this.generTimeFLoat32Array.set(array1Util$1, this.chamberSmokeIndex * 1);
    this.generTimeBufferAttribute.needsUpdate = true;
    array1Util$1[0] = Math.random();
    this.randFoat32Array.set(array1Util$1, this.chamberSmokeIndex * 1);
    this.randBufferAttribute.needsUpdate = true;
    if (this.chamberSmokeIndex + 1 >= this.maximun)
      this.chamberSmokeIndex = 0;
    else
      this.chamberSmokeIndex += 1;
  }
  callEveryFrame(deltaTime, elapsedTime) {
    this.chamberSmokeSM.uniforms.uTime.value = elapsedTime;
  }
}

const muzzlesflashVert = "attribute float rand;\r\n\r\nuniform float uScale;\r\n\r\nvarying float vRand;\r\n\r\nvoid main(){\r\n    \r\n    vRand=rand;\r\n    \r\n    gl_PointSize=200.;// basic\r\n    gl_PointSize*=uScale;// 自定义大小\r\n    \r\n    gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.);\r\n}";

const muzzlesflashFrag = "uniform sampler2D uOpenFireT;\r\nuniform float uTime;\r\nuniform float uFireTime;\r\nuniform float uFlashTime;// 出现闪光的持续时间\r\n\r\nvarying float vRand;\r\n\r\nfloat expImpulse(float x,float k)\r\n{\r\n    float h=k*x;\r\n    return h*exp(1.-h);\r\n}\r\n\r\nmat4 makeRotationZ(float theta)\r\n{\r\n    return mat4(\r\n        cos(theta),-sin(theta),0,0,\r\n        sin(theta),cos(theta),0,0,\r\n        0,0,1,0,\r\n        0,0,0,1\r\n    );\r\n}\r\n\r\nvoid main(){\r\n    \r\n    vec4 randRotate=makeRotationZ(vRand*3.14)*vec4(gl_PointCoord-vec2(.5),0.,1.);\r\n    vec4 colorFromT=texture2D(uOpenFireT,randRotate.xy+vec2(.5));\r\n    \r\n    float elapsedTime=uTime-uFireTime;\r\n    float flashMask=step(elapsedTime,uFlashTime);\r\n    \r\n    gl_FragColor=vec4(colorFromT.rgb,colorFromT.a*flashMask);\r\n    \r\n}";

const flashTexture = "data:image/png;base64,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";

const image = new Image();
const texture = new Texture(image);
image.src = flashTexture;
image.onload = () => {
  texture.needsUpdate = true;
};
const muzzlePositionUtil = new Vector3();
const array3Util = new Array(3);
const array1Util = new Array(1);
class MuzzleFlashLayer {
  ifRender = false;
  scene;
  camera;
  muzzleFlashSize = 1.5;
  muzzleFlashTime = 0.01;
  muzzleFlashGeometry = new BufferGeometry();
  muzzleFlashSM = new ShaderMaterial({
    uniforms: {
      uScale: { value: this.muzzleFlashSize },
      uTime: { value: -1 },
      uFireTime: { value: -1 },
      uOpenFireT: { value: texture },
      uFlashTime: { value: this.muzzleFlashTime }
    },
    vertexShader: muzzlesflashVert,
    fragmentShader: muzzlesflashFrag,
    blending: AdditiveBlending
  });
  positionFoat32Array;
  positionBufferAttribute;
  randFloat32Array;
  randBufferAttribute;
  init() {
    this.scene = GameContext.Scenes.Handmodel;
    this.camera = GameContext.Cameras.PlayerCamera;
    const muzzleFlash = new Points(this.muzzleFlashGeometry, this.muzzleFlashSM);
    muzzleFlash.frustumCulled = false;
    this.scene.add(muzzleFlash);
    this.initBuffers();
    GameLogicEventPipe.addEventListener(WeaponEquipEvent.type, (e) => {
      const _weaponInstance = WeaponEquipEvent.detail.weaponInstance;
      if (WeaponEquipEvent.detail.weaponInstance && WeaponEquipEvent.detail.weaponInstance.muzzlePosition) {
        muzzlePositionUtil.copy(_weaponInstance.muzzlePosition);
        this.ifRender = true;
      } else
        this.ifRender = false;
    });
    LayerEventPipe.addEventListener(ShotOutWeaponFireEvent.type, (e) => {
      if (this.ifRender)
        this.render();
    });
  }
  initBuffers() {
    this.positionFoat32Array = new Float32Array(new ArrayBuffer(4 * 3));
    this.randFloat32Array = new Float32Array(new ArrayBuffer(4 * 1));
    this.positionBufferAttribute = new BufferAttribute(this.positionFoat32Array, 3);
    this.randBufferAttribute = new BufferAttribute(this.randFloat32Array, 1);
    this.muzzleFlashGeometry.setAttribute("position", this.positionBufferAttribute);
    this.muzzleFlashGeometry.setAttribute("rand", this.randBufferAttribute);
  }
  render() {
    this.positionFoat32Array.set(muzzlePositionUtil.toArray(array3Util, 0), 0);
    this.positionBufferAttribute.needsUpdate = true;
    this.muzzleFlashSM.uniforms.uFireTime.value = GameContext.GameLoop.Clock.getElapsedTime();
    const rand = Math.random();
    array1Util[0] = rand;
    this.randFloat32Array.set(array1Util, 0);
    this.randBufferAttribute.needsUpdate = true;
  }
  callEveryFrame(deltaTime, elapsedTime) {
    this.muzzleFlashSM.uniforms.uTime.value = elapsedTime;
  }
}

const GameObjects = [
  new DOMLayer(),
  new SkyLayer(),
  new HandModelLayer(),
  new CrosshairLayer(),
  new BulletHoleLayer(),
  new BulletHoleFlashLayer(),
  new BulletHoleAshLayer(),
  new ChamberBulletShell(),
  new ChamberSmokeLayer(),
  new MuzzleFlashLayer(),
  new GLViewportLayer(),
  new LevelMirage(),
  LocalPlayer.getInstance()
];
const GameObjectsMap = /* @__PURE__ */ new Map();
GameObjects.forEach((item) => {
  GameObjectsMap.set(item.constructor.name, item);
});

export { GameObjectsMap };
//# sourceMappingURL=GameObjectMap.92931f61.js.map
