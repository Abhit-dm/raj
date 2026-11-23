package com.rajworthman.driver;

import android.Manifest;

import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

/**
 * Exposes the app's runtime permissions to the web layer.
 * The base Plugin class provides checkPermissions() and requestPermissions({ permissions: [...] })
 * for the aliases declared here, so no extra methods are needed.
 * Used by the sign-up "Allow permissions" screen (src/lib/device.ts).
 */
@CapacitorPlugin(
    name = "AppPermissions",
    permissions = {
        @Permission(alias = "location", strings = { Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION }),
        @Permission(alias = "camera", strings = { Manifest.permission.CAMERA }),
        // Android 13+ photo access; older versions use "storage" below
        @Permission(alias = "media", strings = { Manifest.permission.READ_MEDIA_IMAGES }),
        @Permission(alias = "storage", strings = { Manifest.permission.READ_EXTERNAL_STORAGE }),
        @Permission(alias = "phone", strings = { Manifest.permission.READ_PHONE_STATE, Manifest.permission.CALL_PHONE }),
        @Permission(alias = "sms", strings = { Manifest.permission.RECEIVE_SMS, Manifest.permission.READ_SMS })
    }
)
public class AppPermissionsPlugin extends Plugin {}
