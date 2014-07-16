/*!
 * @author yomotsu http://yomotsu.net/
 * MIT License
 */

var THREEFIELD = {};

// @author yomotsu
// MIT License

THREEFIELD.normalizeAngle = function ( angleInDeg ) {

  return ( angleInDeg >= 0 ) ? ( angleInDeg % 360 ) : ( angleInDeg  % 360 + 360 );

};


THREEFIELD.howCloseBetweenAngles = function ( angle1, angle2 ) {

  var angle = Math.min(
    THREEFIELD.normalizeAngle( angle1 - angle2 ),
    THREEFIELD.normalizeAngle( angle2 - angle1 )
  );
  
  return angle;

};

// @author yomotsu
// MIT License

THREEFIELD.World = function () {

  console.log( 'THREEFIELD.World' );

  this.colliders  = [];
  this.characters = [];

};

THREEFIELD.World.prototype.add = function ( collider ) {

  this.colliders.push( collider );

}

THREEFIELD.World.prototype.addCharacter = function ( character ) {

  this.characters.push( character );

}

THREEFIELD.World.prototype.step = function ( dt ) {

  var character,
      collider,
      isInAABB,
      contactInfo,
      hasAdded,
      contactPoint = new THREE.Vector3(),
      i, ii, iii, iiii, l, ll, lll, llll;


  for ( i = 0, l = this.characters.length; i < l; i ++ ) {

    character = this.characters[ i ];
    character.update( dt );
    character.contactInfo.length = 0;

    for ( ii = 0, ll = this.colliders.length; ii < ll; ii ++ ) {

      collider = this.colliders[ ii ];
      isInAABB = THREEFIELD.World.sphereInAABB( character.position, character.radius, collider.aabb );
      
      if ( !isInAABB ) {

        continue;

      }

      for ( iii = 0, lll = collider.faces.length; iii < lll; iii ++ ) {

        contactInfo = THREEFIELD.World.sphereVsTriangle( collider.faces[ iii ], collider.normals[ iii ], character.position, character.radius );

        if ( !contactInfo ) {

          continue;

        }

        hasAdded = false;
        
        for ( iiii = 0, llll = character.contactInfo.length; iiii < llll; iiii ++ ) {

          if (
            character.contactInfo[ iiii ].normal.x === contactInfo.normal.x &&
            character.contactInfo[ iiii ].normal.y === contactInfo.normal.y &&
            character.contactInfo[ iiii ].normal.z === contactInfo.normal.z
          ) {

            hasAdded = true;
            break;

          }

        }

        if ( hasAdded ) {

          continue;

        }

        character.contactInfo.push( contactInfo );

      }

    }

    character.fixPosition();

  }

};

THREEFIELD.World.sphereInAABB = function ( position, radius, aabb ) {
  // http://d.hatena.ne.jp/taiyakisun/20120205/1328410006
  // http://marupeke296.com/COL_3D_No11_AABBvsPoint.html
  // http://stackoverflow.com/questions/4578967/cube-sphere-intersection-test#answer-4579192
  var rr = Math.pow( radius, 2 ),
      dmin = 0,
      axis,
      axisKey = [ 'x', 'y', 'z' ],
      i;

  for ( i in axisKey ) {

    axis = axisKey[ i ];

    if( position[ axis ] < aabb.min[ axis ] ) {

      dmin += Math.pow( ( position[ axis ] - aabb.min[ axis ] ), 2 );

    } else if( position[ axis ] > aabb.max[ axis ] ) {

      dmin += Math.pow( ( position[ axis ] - aabb.max[ axis ] ), 2 );

    }

  }

  return dmin <= rr;

};

THREEFIELD.World.sphereVsTriangle = function ( face, normal, position, radius ) {
  // http://realtimecollisiondetection.net/blog/?p=103

  // var distance = THREEFIELD.World.getDistanceTriangleVsSphere( face, normal, position, radius );
  // vs plain of traiangle face
  var A = new THREE.Vector3(),
      B = new THREE.Vector3(),
      C = new THREE.Vector3(),
      rr,
      V = new THREE.Vector3(),
      d,
      e;

  A.subVectors( face.a, position );
  B.subVectors( face.b, position );
  C.subVectors( face.c, position );
  rr = radius * radius;
  V.crossVectors( B.clone().sub( A ), C.clone().sub( A ) );
  d = A.dot( V );
  e = V.dot( V );

  if ( d * d > rr * e ) {

    return false;

  }

  // vs triangle vertex
  var aa,
      ab,
      ac,
      bb,
      bc,
      cc;

  aa = A.dot( A );
  ab = A.dot( B );
  ac = A.dot( C );
  bb = B.dot( B );
  bc = B.dot( C );
  cc = C.dot( C );

  if (
    ( aa > rr ) & ( ab > aa ) & ( ac > aa ) ||
    ( bb > rr ) & ( ab > bb ) & ( bc > bb ) ||
    ( cc > rr ) & ( ac > cc ) & ( bc > cc )
  ) {

    return false;

  }

  // vs edge
  var AB = new THREE.Vector3(),
      BC = new THREE.Vector3(),
      CA = new THREE.Vector3(),
      d1,
      d2,
      d3,
      e1,
      e2,
      e3,
      Q1 = new THREE.Vector3(),
      Q2 = new THREE.Vector3(),
      Q3 = new THREE.Vector3(),
      QC = new THREE.Vector3(),
      QA = new THREE.Vector3(),
      QB = new THREE.Vector3();

  AB.subVectors( B, A );
  BC.subVectors( C, B );
  CA.subVectors( A, C );
  d1 = ab - aa;
  d2 = bc - bb;
  d3 = ac - cc;
  e1 = AB.dot( AB );
  e2 = BC.dot( BC );
  e3 = CA.dot( CA );
  Q1.subVectors( A.multiplyScalar( e1 ), AB.multiplyScalar( d1 ) );
  Q2.subVectors( B.multiplyScalar( e2 ), BC.multiplyScalar( d2 ) );
  Q3.subVectors( C.multiplyScalar( e3 ), CA.multiplyScalar( d3 ) );
  QC.subVectors( C.multiplyScalar( e1 ), Q1 );
  QA.subVectors( A.multiplyScalar( e2 ), Q2 );
  QB.subVectors( B.multiplyScalar( e3 ), Q3 );

  if (
    ( Q1.dot( Q1 ) > rr * e1 * e1 ) && ( Q1.dot( QC ) >= 0 ) ||
    ( Q2.dot( Q2 ) > rr * e2 * e2 ) && ( Q2.dot( QA ) >= 0 ) ||
    ( Q3.dot( Q3 ) > rr * e3 * e3 ) && ( Q3.dot( QB ) >= 0 )
  ) {

    return false;

  }

  var distance = Math.sqrt( d * d / e ) - radius,
      contactPoint = THREEFIELD.World.getContactPoint( normal, position, distance );

  return {
    face        : face,
    normal      : normal,
    distance    : distance,
    contactPoint: contactPoint
  };

};

THREEFIELD.World.getContactPoint = function ( normal, position, distance ) {

  var contactPoint = new THREE.Vector3(),
      inversedNormal = new THREE.Vector3( -normal.x, -normal.y, -normal.z );

  contactPoint.copy( position ).add( inversedNormal.multiplyScalar( distance ) );
  return contactPoint;

}

// @author yomotsu
// MIT License

THREEFIELD.Collider = function ( threeMesh ) {

  var geometry,
      i, l;

  this.mesh = threeMesh;
  this.faces   = [];
  this.normals = [];
  this.aabb    = null;

  // http://stackoverflow.com/questions/23990354/how-to-update-vertices-geometry-after-rotate-or-move-object#answer-24001626
  threeMesh.updateMatrix(); 
  threeMesh.geometry.applyMatrix( threeMesh.matrix );
  threeMesh.matrix.identity();
  threeMesh.position.set( 0, 0, 0 );
  threeMesh.rotation.set( 0, 0, 0 );
  threeMesh.scale.set( 1, 1, 1 );
  threeMesh.geometry.verticesNeedUpdate = true;
  threeMesh.updateMatrixWorld();
  threeMesh.geometry.computeFaceNormals();
  threeMesh.geometry.computeVertexNormals();
  threeMesh.geometry.computeBoundingBox();

  this.aabb = threeMesh.geometry.boundingBox;
  geometry = this.mesh.geometry;

  for ( i = 0, l = geometry.faces.length; i < l; i ++ ) {

    if ( geometry.faces[ i ].d ) {

      console.log( 'still not supported' );

    }

    var a = geometry.vertices[ geometry.faces[ i ].a ];
    var b = geometry.vertices[ geometry.faces[ i ].b ];
    var c = geometry.vertices[ geometry.faces[ i ].c ];

    this.faces.push( { a: a, b: b, c: c } );
    this.normals.push( geometry.faces[ i ].normal );

  }

};
