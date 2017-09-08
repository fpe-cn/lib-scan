var Dyst = require('../scan/assets/dynamsoft.webtwain.initiate.js');

module.exports.uninstall = function(config) {
    console.debug('Uninstall dynamsoft');
    Dyst.Dynamsoft.WebTwainEnv.Unload();
}

module.exports.install = function(config) {
    console.debug('Start install dynamsoft with : ' + JSON.stringify(config));
    Dyst.Dynamsoft.WebTwainEnv.AutoLoad = config.AutoLoad;
    Dyst.Dynamsoft.WebTwainEnv.Containers = config.Containers;
    Dyst.Dynamsoft.WebTwainEnv.ProductKey = config.ProductKey;
    Dyst.Dynamsoft.WebTwainEnv.LogLevel = config.LogLevel;
    Dyst.Dynamsoft.WebTwainEnv.Trial = config.Trial;
    Dyst.Dynamsoft.WebTwainEnv.ActiveXInstallWithCAB = config.ActiveXInstallWithCAB;
    Dyst.Dynamsoft.WebTwainEnv.ResourcesPath = config.ResourcesPath;
    Dyst.Dynamsoft.WebTwainEnv.LaunchInstall();
    console.debug('stop install');

    // This event seems to don't work
    Dyst.Dynamsoft.WebTwainEnv.RegisterEvent('OnWebTrainReady', function() {
        console.log('OnWebTrainReady');
        Dyst.Dynamsoft.WebTwainEnv.GetWebTwain('dwtcontrolContainer');
    });
}

module.exports.load = function() {
    return Dyst.Dynamsoft.WebTwainEnv.GetWebTwain('dwtcontrolContainer');
}

module.exports.scan = function scan (config){
    return new Promise(resolve => {
        if (config.scannedImage) {

            var OnAcquireImageSuccess, OnAcquireImageFailure;

            OnAcquireImageFailure = () => config.scannedImage.CloseSource();
            OnAcquireImageSuccess = () => resolve(config)

            config.scannedImage.OpenSource();
            config.scannedImage.IfShowUI = false;
            config.scannedImage.IfShowIndicator = false;
            config.scannedImage.PixelType = Dyst.EnumDWT_PixelType.TWPT_RGB;
            config.scannedImage.Resolution = config.resolution;
            config.scannedImage.IfDisableSourceAfterAcquire = true;	// Scanner source will be disabled/closed automatically after the scan.
            config.scannedImage.AcquireImage(OnAcquireImageSuccess, OnAcquireImageFailure);
        }
    })
}

module.exports.upload = function upload (config, strHTTPServer, strActionPage, imageIndexBuffer = null) {
    return new Promise((resolve, reject) => {
        if (config.scannedImage) {
            if (config.scannedImage.HowManyImagesInBuffer === 0) return

            const OnHttpUploadFailure = (errorCode, errorString, sHttpResponse) => {
                console.warn('fail (' + errorCode + ') on httpRequest : ' + errorString + sHttpResponse)
                reject(errorCode)
            }
            const OnHttpUploadSuccess = () => resolve(true)

            var Digital = new Date()
            var uploadFilename = Digital.getMilliseconds()

            if (config.format === 'pdf') {
                config.scannedImage.SelectedImagesCount = 2
                config.scannedImage.SetSelectedImageIndex(0, 0) // Set the 1st image as the first selected image.
                config.scannedImage.SetSelectedImageIndex(1, 2) // Set the 3rd image as the second selected image.
                config.scannedImage.GetSelectedImagesSize(4)
                config.scannedImage.HTTPUploadThroughPostAsMultiPagePDF(strHTTPServer, strActionPage, uploadFilename + '.pdf', OnHttpUploadSuccess, OnHttpUploadFailure)
            }
            if (config.format === 'jpeg') {
                config.scannedImage.HTTPUploadThroughPost(strHTTPServer, imageIndexBuffer, strActionPage, uploadFilename + '.jpg', OnHttpUploadSuccess, OnHttpUploadFailure)
            }
        }
    })
}
