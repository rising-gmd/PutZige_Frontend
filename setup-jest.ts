// Use the correct import path for jest-preset-angular v16
import 'jest-preset-angular/setup-env/zone';
import '@testing-library/jest-dom';
import { TestBed } from '@angular/core/testing';
import {
	BrowserDynamicTestingModule,
	platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

// Initialize the Angular testing environment for TestBed (required for standalone components)
TestBed.initTestEnvironment(
	BrowserDynamicTestingModule,
	platformBrowserDynamicTesting()
);