import React, { PropTypes } from 'react';
import PhotoSwipe from '../node_modules/photoswipe/dist/photoswipe.min';
import PhotoSwipeUI from '../node_modules/photoswipe/dist/photoswipe-ui-default.min';
import { template } from './template';


class PhotoSwipeWrapper extends React.Component {

  render() {
    return <div id="photoswipe-wrapper" dangerouslySetInnerHTML={{__html: template}}></div>
}

}


function withPhotoSwipe(options = {}) {

  const decoratorOptions = options;

  const thumbnailClassName = options.className;

  return (ComposedComponent) => class PhotoSwipeDecorator extends React.Component {

    constructor() {
      super(arguments);

    }

    images = null;
    oldImages = null;
    component = React.createElement(PhotoSwipeWrapper);
    mountElement = null;
    pswpElement = null;
    galleryName = "react-photoswipe-gallery";


    preparePhotoSwipe() {
      this.mountElement = document.createElement('div');
      this.mountElement.id = "pswp-mount";
      document.body.appendChild(this.mountElement);
      this.componentDidUpdate();
    }

    componentWillUnmount() {
      document.body.removeChild(this.mountElement);
    }

    componentDidUpdate() {
      //console.log('updating')
      //React.render(this.component, this.mountElement);
      this.updateImages();
    }

    imagesHaveChanged() {
      let hasChanged = false;
      if (!this.oldImages || this.oldImages.length !== this.images.length) return true;
      for (let i = 0; i < this.images.length; i++) {
        if (this.images[i].src !== this.oldImages[i].src) {
          hasChanged = true;
          break;
        }
      }
      return hasChanged;
    }

    componentDidMount() {
      //console.log('mounted first time ')

      this.preparePhotoSwipe();
      React.render(this.component, this.mountElement);
      this.pswpElement = React.findDOMNode(this.mountElement).getElementsByClassName('pswp')[0];

      this.updateImages();
    }

    ensureImagesNaturalsAvailable(DOMImages, cb) {

      let unfinishedImages = DOMImages.filter(image => {
        if (!image.complete || (typeof image.naturalWidth !== "undefined" && image.naturalWidth === 0)) return true;
        else return false;
      })

      if (unfinishedImages.length === 0) cb()
      else this.preloadImages(unfinishedImages, cb);
    }

    updateImages() {

      if (!this.images) {
        this.images = []
      } else {
        this.oldImages = this.images;
      }

      this.images = Array.from(React.findDOMNode(this).getElementsByClassName(thumbnailClassName));

      if (!this.imagesHaveChanged()) return;

      this.ensureImagesNaturalsAvailable(this.images, this.addImageItemListener.bind(this));

      window.images = this.images;

    }

    addImageItemListener() {
      this.images.forEach(img => img.addEventListener('click', this.openPhotoSwipe.bind(this)));
    }

    removeImageItemListener() {
      this.images.forEach(img => img.removeEventListener('click', this.openPhotoSwipe.bind(this)));
    }

    openPhotoSwipe(event) {

      let clickedImage = event.currentTarget,
          clickedIndex = 0;

      // find index of image
      for (let i = 0; i < this.images.length; i++) {
        if (this.images[i] === clickedImage) {
          clickedIndex = i;
          break;
        }
      }

      //console.log(clickedIndex);

      let photoSwipeOptions = {
        index                : clickedIndex,
        showAnimationDuration: decoratorOptions.showAnimationDuration || 1000,
        galleryUID           : decoratorOptions.galleryUID || this.galleryName,
        getThumbBoundsFn     : (index) => {
          let rect = this.images[index].getBoundingClientRect();
          return {x: rect.left, y: rect.top, w: rect.width};
        }
      };


      //console.log('width :: ' + img.naturalWidth + ' -- height :: ' + img.naturalHeight)

      let photoSwipeItems = this.images.map(img => {
        return {
          w   : img.dataset.fullsizewidth,
          h   : (img.dataset.fullsizewidth / img.naturalWidth * img.naturalHeight),
          src : img.dataset.fullsizesrc,
          msrc: img.src
        }
      })


      let gallery = new PhotoSwipe(this.pswpElement, PhotoSwipeUI, photoSwipeItems, photoSwipeOptions);

      gallery.listen('close', () => {

      })

      gallery.init()
      window.gallery = gallery;
    }

    preloadImages(imgArray, cb) {
      let counter = 0;

      function done() {
        if (counter === imgArray.length) {
          //console.log('images loaded')
          cb();
        }
      }

      function onFailure(e) {
        e.currentTarget.removeEventListener('error', onFailure.bind(this));
        e.currentTarget.removeEventListener('abort', onFailure.bind(this));
        counter++;
        done();
      }

      function onSuccess(e) {
        e.currentTarget.removeEventListener('load', onSuccess.bind(this));
        counter++;
        done();
      }


      imgArray.forEach(img => {
        img.addEventListener('load', onSuccess.bind(this));
        img.addEventListener('error', onFailure.bind(this)); //todo remove image from gallery list !
        img.addEventListener('abort', onFailure.bind(this)); // todo remove image from gallery list !
      })

    }

    componentWillMount() {

    }

    render() {
      return <ComposedComponent {...this.props} />;
    }

  }


}

export default withPhotoSwipe;