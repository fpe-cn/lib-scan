var Dyst = require('../lib-scan/assets/V12_3/dynamsoft.webtwain.initiate.js');

module.exports.uninstall = function(config) {
    console.debug('Uninstall dynamsoft');
    Dyst.Dynamsoft.WebTwainEnv.Unload();
    Dyst.Dynamsoft.WebTwainEnv.DeleteDWTObject();
}

module.exports.install = function(config) {
    console.debug('Start install dynamsoft with : ' + JSON.stringify(config));
    Dyst.Dynamsoft.WebTwainEnv.AutoLoad = config.AutoLoad || false;
    Dyst.Dynamsoft.WebTwainEnv.Containers = config.Containers;
    Dyst.Dynamsoft.WebTwainEnv.ProductKey = config.ProductKey;
    Dyst.Dynamsoft.WebTwainEnv.LogLevel = config.LogLevel;
    Dyst.Dynamsoft.WebTwainEnv.Trial = config.Trial;
    Dyst.Dynamsoft.WebTwainEnv.ActiveXInstallWithCAB = config.ActiveXInstallWithCAB || false;
    Dyst.Dynamsoft.WebTwainEnv.ResourcesPath = config.ResourcesPath;
    Dyst.Dynamsoft.WebTwainEnv.IfShowProgressBar = config.IfShowProgressBar || false;
    Dyst.Dynamsoft.WebTwainEnv.IfShowUI = config.IfShowUI || false;
    Dyst.Dynamsoft.WebTwainEnv.IfShowIndicator = config.IfShowIndicator || false;
    Dyst.Dynamsoft.WebTwainEnv.ScanDirectly = config.ScanDirectly || true;
    Dyst.Dynamsoft.WebTwainEnv.IfShowCancelDialogWhenImageTransfer = config.IfShowCancelDialogWhenImageTransfer || false;
    Dyst.Dynamsoft.WebTwainEnv.IfFeederEnabled = config.IfFeederEnabled || false;
    Dyst.Dynamsoft.WebTwainEnv.IfDuplexEnabled = config.IfDuplexEnabled || false;
    Dyst.Dynamsoft.WebTwainEnv.IfDisableSourceAfterAcquire = config.IfDisableSourceAfterAcquire || true;	// Scanner source will be disabled/closed automatically after the scan.

    // Dyst.Dynamsoft.WebTwainEnv.CheckConfigLoaded()
    Dyst.Dynamsoft.WebTwainEnv.Load();
}

module.exports.load = function() {
    return Dyst.Dynamsoft.WebTwainEnv.GetWebTwain('dwtcontrolContainer');
}

module.exports.scan = function scan (config) {
    return new Promise((resolve, reject) => {
        if (config.scannedImage) {

            var OnAcquireImageSuccess, OnAcquireImageFailure;

            OnAcquireImageFailure = (errorCode, errorString) => {
                const message = `Scan image N° ${config.scannedImage.CurrentImageIndexInBuffer + 2} ==> failure`;
                console.warn(message);
                reject(message);
            }

            OnAcquireImageSuccess = () => {
                console.debug('Scan image N°' + (config.scannedImage.CurrentImageIndexInBuffer + 1) + ' ==> success')
                resolve(config)
            }

            config.scannedImage.OpenSource();
            config.scannedImage.IfShowUI = false;
            config.scannedImage.IfShowProgressBar = false;
            config.scannedImage.IfShowIndicator = false;
            config.scannedImage.IfFeederEnabled = false;
            config.scannedImage.IfDuplexEnabled = false;
            config.scannedImage.IfAutomaticBorderDetection = false;
            config.scannedImage.PixelType = Dyst.EnumDWT_PixelType.TWPT_RGB; // 2
            config.scannedImage.IfDisableSourceAfterAcquire = true;	// Scanner source will be disabled/closed automatically after the scan.
            config.scannedImage.Resolution = config.resolution;
            config.scannedImage.AcquireImage(OnAcquireImageSuccess, OnAcquireImageFailure);
        }
    })
}

module.exports.upload = function upload (config, strHTTPServer, strActionPage, imageIndexBuffer, uploadFilename) {
    return new Promise((resolve, reject) => {
        if (config.scannedImage) {
            if (config.scannedImage.HowManyImagesInBuffer === 0) {
                console.warn('Trying upload but HowManyImagesInBuffer = ' + config.scannedImage.HowManyImagesInBuffer)
                return
            }

            console.debug('Start uploading image n°' + (imageIndexBuffer + 1) + ' from buffer of ' + config.scannedImage.HowManyImagesInBuffer + ' images')

            const OnHttpUploadFailure = (errorCode, errorString, httpResponse) => {
                if(typeof httpRequest !== undefined) {
                    try {
                        const response = JSON.parse(httpResponse)
                        if(response.message.value.includes('Resource is created')) {
                            resolve(true)
                        }
                    } catch(e) {
                        console.warn('fail (' + errorCode + ') on httpRequest : ' + errorString + httpResponse)
                        reject(errorCode)
                    }
                } else {
                    console.warn('fail (' + errorCode + ') on httpRequest : ' + errorString)
                    reject(errorCode)
                }
            }
            const OnHttpUploadSuccess = () => resolve(true)

            if (window.location.protocol !== 'https:') {
                config.scannedImage.HTTPPort = 80;
                config.scannedImage.IfSSL = false;
                // if 80 is the port number of non-secure port
            }
            else {
                config.scannedImage.HTTPPort = 443;
                config.scannedImage.IfSSL = true;
                // if 443 is the port number of secure port
            }
            config.scannedImage.IfShowCancelDialogWhenImageTransfer = false;

            if (config.format === 'pdf') {
                config.scannedImage.SelectedImagesCount = 2
                config.scannedImage.SetSelectedImageIndex(0, 0)
                config.scannedImage.SetSelectedImageIndex(1, 1)
                config.scannedImage.GetSelectedImagesSize(4)
                config.scannedImage.HTTPUploadThroughPostAsMultiPagePDF(strHTTPServer, strActionPage, uploadFilename + '.pdf', OnHttpUploadSuccess, OnHttpUploadFailure)
            }
            if (config.format === 'jpeg') {
                config.scannedImage.HTTPUploadThroughPost(strHTTPServer, imageIndexBuffer, strActionPage, uploadFilename + '.jpg', OnHttpUploadSuccess, OnHttpUploadFailure)
            }
        }
    })
}
