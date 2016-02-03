////////////////////////////////////////////////////////////////////////////
// An image created with the camrea has the following associated elements
// image --> ID  = imge n
// clipPath -- > ID = clip_ +imageid
// path for clip -- > ID = pathmask_ + imageid
// visible path border  --> ID = pathborder_ + imageid
///////////////////////////////////////////////////////////////////
import Path from './Path';
import Paint from './Paint';
import Layer from './Layer';
import Transform from './Transform';
import Rectangle from '../geom/Rectangle';
import SVGTools from './SVGTools';
import SVG2Canvas from '../utils/SVG2Canvas';
import PaintAction from './PaintAction';
import {getIdFor, gn, getIdForCamera, setCanvasSize, DEGTOR} from '../utils/lib';

export default class SVGImage {
    static addCameraFill (mt, str) {
        //  prepare to insert image by getting the objects above
        if (mt.getAttribute('relatedto')) {
            Path.breakRelationship(mt, mt.getAttribute('relatedto'));
        }
        var mtimage = SVGImage.getImage(mt);
        if (mtimage) {
            SVGImage.removeClip(mtimage, true);
            mt.setAttribute('id', getIdFor(mt.nodeName));
        }
        SVGImage.createImageFromFeed(mt, str);
    }

    static replaceImage (img, str) {
        img.setAttributeNS(Paint.xmlnslink, 'xlink:href', 'data:image/png;base64,' + str);
    }

    static createImageFromFeed (mt, str) {
        var p = mt.parentNode;
        var isbkg = (mt.id == 'staticbkg');
        var index = Layer.groupStartsAt(p, mt);
        var group = Layer.onTopOf(p, index);
        var viewbox = SVGTools.getBox(mt).rounded();
        var box = new Rectangle(0, 0, Paint.workspaceWidth, Paint.workspaceHeight);
        viewbox = viewbox.expandBy(20);
        viewbox.crop(box);
        var imageid = getIdForCamera('image');
        if (isbkg) {
            imageid += 'staticbkg';
        }
        var g = SVGTools.createGroup(p, 'group_' + imageid);
        // Make the clip Path
        var pathmask = SVGTools.getCopy(mt);
        var maskattr = {
            'id': 'pathmask_' + imageid
        };
        for (var val in maskattr) {
            pathmask.setAttribute(val, maskattr[val]);
        }
        var clippath = SVGTools.addChild(g, 'clipPath', {
            id: 'clip_' + imageid,
            clipPathUnits: 'userSpaceOnUse'
        });
        clippath.appendChild(pathmask);

        // Make the image
        var img = document.createElementNS(Paint.xmlns, 'image');
        var attr = {
            'x': viewbox.x,
            'y': viewbox.y,
            'width': viewbox.width,
            'height': viewbox.height,
            'id': imageid
        };
        for (var vl1 in attr) {
            img.setAttribute(vl1, attr[vl1]);
        }
        img.setAttributeNS(Paint.xmlnslink, 'xlink:href', 'data:image/png;base64,' + str);
        img.setAttribute('clip-path', 'url(#clip_' + imageid + ')');
        g.appendChild(img);
        // redefine the orginal shape
        var borderattr = {
            'id': 'pathborder_' + imageid,
            fill: 'none'
        };
        for (var vl2 in borderattr) {
            mt.setAttribute(vl2, borderattr[vl2]);
        }

        // re-org of the SVG objects
        for (var i = 0; i < group.length; i++) {
            p.appendChild(group[i]);
        }
    }

    //////////////////////
    // Actions on Images
    ///////////////////////

    static removeClip (img, keepmt) {
        var imageid = img.getAttribute('id');
        var isbkg = imageid.indexOf('staticbkg') > -1;
        var clip = gn('clip_' + imageid);
        var group = gn('group_' + imageid);
        var pathborder = gn('pathborder_' + imageid);
        if (isbkg && !keepmt) {
            var path = clip.childNodes[0];
            path.id = 'staticbkg',
            gn('layer1').appendChild(path);
        } else {
            if (group) {
                group.parentNode.removeChild(group);
            } else {
                if (clip) {
                    clip.parentNode.removeChild(clip);
                }
                img.parentNode.removeChild(img);
            }
        }
        if (pathborder && !keepmt) {
            pathborder.parentNode.removeChild(pathborder);
        }
    }

    static paint (img) {
        var imageid = img.getAttribute('id');
        var isbkg = img.id.indexOf('staticbkg') > -1;
        var pathborder = gn('pathborder_' + imageid);
        pathborder.setAttribute('id', isbkg ? 'staticbkg' : getIdFor('path'));
        var clip = gn('clip_' + imageid);
        var group = gn('group_' + imageid);
        if (group) {
            group.parentNode.removeChild(group);
        } else {
            if (clip) {
                clip.parentNode.removeChild(clip);
            }
            img.parentNode.removeChild(img);
        }
        PaintAction.currentshape = pathborder;
    }

    ///////////////////////
    //	Mask for camera
    ///////////////////////

    static draw (image, clip, ctx, fcn) {
        var angle = Transform.getRotationAngle(image);
        var center = SVGTools.getBoxCenter(image);
        var newcnv = document.createElement('canvas');
        setCanvasSize(newcnv, ctx.canvas.width, ctx.canvas.height);
        var newctx = newcnv.getContext('2d');
        var dataurl = image.getAttribute('xlink:href');
        var img = document.createElement('img');
        img.src = dataurl;
        if (!img.complete) {
            img.onload = function () {
                drame(img, newctx, angle, center);
            };
        } else {
            drame(img, newctx, angle, center);
        }

        function drame (img, c, angle, center) {
            var x = Number(image.getAttribute('x'));
            var y = Number(image.getAttribute('y'));
            var width = Number(image.getAttribute('width'));
            var height = Number(image.getAttribute('height'));
            c.fillStyle = 'red';
            c.fillRect(x, y, width, height);
            c.save();
            c.translate(center.x, center.y);
            c.rotate(angle * DEGTOR);
            c.translate(-center.x, -center.y);
            c.drawImage(img, x, y, width, height);
            c.restore();
            c.save();
            c.globalCompositeOperation = 'destination-in';
            c.fillStyle = '#f30';
            c.strokeStyle = 'rgba(0,0,0,0)';
            SVG2Canvas.processXMLnode(clip, c);
            c.restore();
            ctx.drawImage(newcnv, 0, 0);
            if (fcn) {
                fcn();
            }
        }

    }

    static getImage (mt) {
        if (!mt) {
            return null;
        }
        if (mt.nodeName == 'image') {
            return mt;
        }
        if (mt.nodeName == 'g') {
            var str = mt.id;
            var elem = str.indexOf('group_image_') > -1 ? gn(str.substr(6, str.length)) : null;
            return !elem ? null : (elem.tagName == 'image') ? elem : null;
        }
        if ((mt.id.indexOf('pathborder_image') < 0) && (mt.id.indexOf('pathmask_image') < 0)) {
            return null;
        }
        var imageid = (mt.id.indexOf('pathborder_image') < 0) ?
            mt.id.substring(String('pathmask_').length, mt.id.length) :
            mt.id.substring(String('pathborder_').length, mt.id.length);
        return gn(imageid);
    }

    static getPathMask (mt) {
        if (mt.id.indexOf('pathborder_image') < 0) {
            return null;
        }
        var imageid = mt.id.substring(String('pathborder_').length, mt.id.length);
        return gn('pathmask_' + imageid);
    }

    static getPathBorder (mt) {
        if (mt.id.indexOf('image_') == 0) {
            return gn('pathborder_' + mt.id);
        }
        if (mt.id.indexOf('pathmask_') > -1) {
            var imageid = mt.id.substring(String('pathmask_').length, mt.id.length);
            return gn('pathborder_' + imageid);
        }
        return mt;
    }

    ///////////////////////
    // Cloning
    ///////////////////////

    static cloneImage (p, elem) {
        var img = SVGImage.getClonedImage(elem);
        var imageid = img.id;
        var dataurl = elem.getAttribute('xlink:href');
        var html5img = document.createElement('img');
        html5img.src = dataurl;
        if (!html5img.complete) {
            html5img.onload = function () {
                renderImage(img);
            };
        } else {
            renderImage(img);
        }
        function renderImage (img) {
            var cnv = document.createElement('canvas');
            setCanvasSize(cnv, Number(img.getAttribute('width')), Number(img.getAttribute('height')));
            var ctx = cnv.getContext('2d');
            ctx.drawImage(html5img, 0, 0);
            var imgdata = cnv.toDataURL('image/png');
            img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', imgdata);
        }

        // Make the clip Path
        var pathmask = SVGTools.getCopy(gn('pathmask_' + elem.id));
        var maskattr = {
            'id': 'pathmask_' + imageid
        };
        for (var val in maskattr) {
            pathmask.setAttribute(val, maskattr[val]);
        }
        var g = SVGTools.createGroup(p, 'group_' + imageid);
        var clippath = SVGTools.addChild(g, 'clipPath', {
            id: 'clip_' + imageid,
            clipPathUnits: 'userSpaceOnUse'
        });
        clippath.appendChild(pathmask);
        img.setAttribute('clip-path', 'url(#clip_' + imageid + ')');
        g.appendChild(img);
        var pathborder = SVGTools.getCopy(gn('pathborder_' + elem.id));
        var borderattr = {
            'id': 'pathborder_' + imageid
        };
        for (var vl in borderattr) {
            pathborder.setAttribute(vl, borderattr[vl]);
        }
        p.appendChild(pathborder);
        Transform.translateTo(img, window.xform);
        Transform.translateTo(pathmask, window.xform);
        Transform.translateTo(pathborder, window.xform);
        return img;
    }

    static getClonedImage (elem) {
        var attr = SVGTools.attributeTable[elem.tagName];
        var shape = document.createElementNS(Paint.xmlns, elem.tagName);

        for (var i = 0; i < attr.length; i++) {
            shape.setAttribute(attr[i], elem.getAttribute(attr[i]));
        }

        var imageid = getIdForCamera('image');
        shape.setAttribute('id', imageid);
        var ang = Transform.getRotationAngle(elem);
        if (ang != 0) {
            Transform.applyRotation(shape, ang);
        }
        return shape;
    }


    //////////////////////////////
    // Path edditing
    /////////////////////////////

    static rotatePointsOf (shape) {
        var elem = SVGImage.getImage(shape);
        var mask = SVGImage.getPathMask(shape);
        if (!mask) {
            return;
        }
        var angle = Transform.getRotationAngle(elem);
        mask.setAttributeNS(null, 'd', shape.getAttribute('d'));
        if (angle == 0) {
            return;
        }
        var center = SVGTools.getBoxCenter(elem);
        var rot = Paint.root.createSVGTransform();
        rot.setRotate(-angle, center.x, center.y);
        Transform.rotateFromPoint(rot, mask);
    }
}
