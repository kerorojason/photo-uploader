import React, { Component } from 'react';
import Dropzone from 'react-dropzone';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  base64StringtoFile,
  downloadBase64File,
  extractImageFileExtensionFromBase64,
  image64toCanvasRef
} from './Utils';

const acceptedFileTypes =
  'image/x-png, image/png, image/jpg, image/jpeg, image/gif';
const acceptedFileTypesArray = acceptedFileTypes.split(',').map(item => {
  return item.trim();
});
const imageMaxSize = 26214400; //25MB, 26214400Byte

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      imgSrc: null,
      imgSrcExt: null,
      crop: { aspect: 1 / 1 },
      url: null
    };
    this.imagePreviewCanvasRef = React.createRef();
  }
  verifyFile = files => {
    if (files && files.length > 0) {
      const currentFile = files[0];
      const currentFileType = currentFile.type;
      const currentFileSize = currentFile.size;
      if (currentFileSize > imageMaxSize) {
        alert(
          'This file is not allowed. ' + currentFileSize + ' bytes is too large'
        );
        return false;
      }
      if (!acceptedFileTypesArray.includes(currentFileType)) {
        alert('This file is not allowed. Only images are allowed.');
        return false;
      }
      return true;
    }
  };

  handleOnDrop = (files, rejectedFiles) => {
    if (rejectedFiles && rejectedFiles.length > 0) {
      this.verifyFile(rejectedFiles);
    }
    if (files && files.length > 0) {
      const isVerified = this.verifyFile(files);
      if (isVerified) {
        // imageBase64Data
        const currentFile = files[0];
        const myFileItemReader = new FileReader();
        myFileItemReader.addEventListener(
          'load',
          () => {
            // console.log(myFileItemReader.result)
            const myResult = myFileItemReader.result;
            this.setState({
              imgSrc: myResult,
              imgSrcExt: extractImageFileExtensionFromBase64(myResult)
            });
          },
          false
        );

        myFileItemReader.readAsDataURL(currentFile);
      }
    }
  };

  handleImageLoaded = image => {
    // console.log(image);
  };

  handleOnCropChange = crop => {
    this.setState({ crop });
  };

  handleOnCropComplete = (crop, pixelCrop) => {
    // console.log(crop, pixelCrop);
    const canvasRef = this.imagePreviewCanvasRef.current;
    const { imgSrc } = this.state; //original base64 image
    image64toCanvasRef(canvasRef, imgSrc, pixelCrop);
  };

  handleDownloadClick = e => {
    e.preventDefault();
    const { imgSrc, imgSrcExt } = this.state; //original base64 image
    if (imgSrc) {
      const canvasRef = this.imagePreviewCanvasRef.current;
      const fileName = 'preview.' + imgSrcExt;
      const croppedImgSrc = canvasRef.toDataURL('image/' + imgSrcExt);

      // file to be uploaded
      const myNewCroppedFile = base64StringtoFile(imgSrc, fileName);
      console.log(myNewCroppedFile);

      // downloaded file
      downloadBase64File(croppedImgSrc, fileName);
    }
  };

  handleClearToDefault = e => {
    if (e) e.preventDefault();
    const canvas = this.imagePreviewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.setState({
      imgSrc: null,
      imgSrcExt: null,
      crop: {
        aspect: 1 / 1
      }
    });
  };

  handleOnURLChange = e => {
    this.setState({ url: e.target.value });
  };
  handleOnURLSubmit = e => {
    fetch(this.state.url, {
      mode: 'cors'
    }).then(response => {
      response.arrayBuffer().then(buffer => {
        var base64Flag = 'data:image/jpeg;base64,';
        var imageStr = this.arrayBufferToBase64(buffer);

        // document.querySelector('img').src = base64Flag + imageStr;
        this.setState({
          imgSrc: base64Flag + imageStr,
          imgSrcExt: extractImageFileExtensionFromBase64(base64Flag + imageStr)
        });
      });
    });
  };

  arrayBufferToBase64(buffer) {
    var binary = '';
    var bytes = [].slice.call(new Uint8Array(buffer));
    bytes.forEach(b => (binary += String.fromCharCode(b)));
    return window.btoa(binary);
  }
  render() {
    const { imgSrc, crop } = this.state;

    return (
      <div>
        <h1 className='mt-4'>Photo Uploader</h1>
        <br />

        {imgSrc !== null ? (
          <div>
            <ReactCrop
              src={imgSrc}
              crop={crop}
              onChange={this.handleOnCropChange}
              onImageLoaded={this.handleImageLoaded}
              onComplete={this.handleOnCropComplete}
            />
            <br />
            <button
              className='btn btn-outline-dark mr-1'
              onClick={this.handleDownloadClick}
            >
              Download
            </button>
            <button
              className='btn btn-outline-dark'
              onClick={this.handleClearToDefault}
            >
              Clear
            </button>
            <hr />
            <p>Preview</p>
            <canvas ref={this.imagePreviewCanvasRef} />
          </div>
        ) : (
          <div>
            <Dropzone
              onDrop={this.handleOnDrop}
              accept={acceptedFileTypes}
              multiple={false}
              maxSize={imageMaxSize}
            >
              {({ getRootProps, getInputProps }) => (
                <div className='drop-zone' {...getRootProps()}>
                  <input {...getInputProps()} />
                  <i className='fas fa-cloud-upload-alt fa-5x' />
                  <h3>Drag and drop or click here </h3>
                  <p>to upload your image(max 25MB)</p>
                </div>
              )}
            </Dropzone>{' '}
            <br />
            <div className='input-group'>
              <input
                type='url'
                placeholder='Or paste image URL to upload your image ...'
                className='form-control'
                onChange={this.handleOnURLChange}
              />
              <button
                className='btn btn-dark ml-2'
                onClick={this.handleOnURLSubmit}
              >
                Upload
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default App;
