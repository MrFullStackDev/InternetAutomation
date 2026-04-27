import { test as base } from '@playwright/test';
import { ABTestPage } from '../pages/ABTestPage.js';
import { AddRemoveElementsPage } from '../pages/AddRemoveElementsPage.js';
import { BasicAuthPage } from '../pages/BasicAuthPage.js';
import { BrokenImagesPage } from '../pages/BrokenImagesPage.js';
import { ChallengingDomPage } from '../pages/ChallengingDomPage.js';
import { CheckboxesPage } from '../pages/CheckboxesPage.js';
import { ContextMenuPage } from '../pages/ContextMenuPage.js';
import { DigestAuthPage } from '../pages/DigestAuthPage.js';
import { DisappearingElementsPage } from '../pages/DisappearingElementsPage.js';
import { DragAndDropPage } from '../pages/DragAndDropPage.js';
import { DropdownPage } from '../pages/DropdownPage.js';
import { DynamicContentPage } from '../pages/DynamicContentPage.js';
import { DynamicControlsPage } from '../pages/DynamicControlsPage.js';
import { DynamicLoadingPage } from '../pages/DynamicLoadingPage.js';
import { EntryAdPage } from '../pages/EntryAdPage.js';
import { ExitIntentPage } from '../pages/ExitIntentPage.js';
import { FileDownloadPage } from '../pages/FileDownloadPage.js';
import { FileUploadPage } from '../pages/FileUploadPage.js';
import { FloatingMenuPage } from '../pages/FloatingMenuPage.js';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage.js';
import { FramesPage, IFramePage } from '../pages/FramesPage.js';
import { GeolocationPage } from '../pages/GeolocationPage.js';
import { HomePage } from '../pages/HomePage.js';
import { HorizontalSliderPage } from '../pages/HorizontalSliderPage.js';
import { HoversPage } from '../pages/HoversPage.js';
import { InfiniteScrollPage } from '../pages/InfiniteScrollPage.js';
import { InputsPage } from '../pages/InputsPage.js';
import { JqueryUiMenuPage } from '../pages/JqueryUiMenuPage.js';
import { JsAlertsPage } from '../pages/JsAlertsPage.js';
import { JsErrorPage } from '../pages/JsErrorPage.js';
import { KeyPressesPage } from '../pages/KeyPressesPage.js';
import { LargeAndDeepDomPage } from '../pages/LargeAndDeepDomPage.js';
import { LoginPage } from '../pages/LoginPage.js';
import { MultipleWindowsPage } from '../pages/MultipleWindowsPage.js';
import { NestedFramesPage } from '../pages/NestedFramesPage.js';
import { NotificationMessagePage } from '../pages/NotificationMessagePage.js';
import { RedirectorPage } from '../pages/RedirectorPage.js';
import { SecureFileDownloadPage } from '../pages/SecureFileDownloadPage.js';
import { ShadowDomPage } from '../pages/ShadowDomPage.js';
import { ShiftingContentPage } from '../pages/ShiftingContentPage.js';
import { SlowResourcesPage } from '../pages/SlowResourcesPage.js';
import { SortableDataTablesPage } from '../pages/SortableDataTablesPage.js';
import { StatusCodesPage } from '../pages/StatusCodesPage.js';
import { TyposPage } from '../pages/TyposPage.js';
import { WysiwygEditorPage } from '../pages/WysiwygEditorPage.js';

interface PageFixtures {
  abTestPage: ABTestPage;
  addRemoveElementsPage: AddRemoveElementsPage;
  basicAuthPage: BasicAuthPage;
  brokenImagesPage: BrokenImagesPage;
  challengingDomPage: ChallengingDomPage;
  checkboxesPage: CheckboxesPage;
  contextMenuPage: ContextMenuPage;
  digestAuthPage: DigestAuthPage;
  disappearingElementsPage: DisappearingElementsPage;
  dragAndDropPage: DragAndDropPage;
  dropdownPage: DropdownPage;
  dynamicContentPage: DynamicContentPage;
  dynamicControlsPage: DynamicControlsPage;
  dynamicLoadingPage: DynamicLoadingPage;
  entryAdPage: EntryAdPage;
  exitIntentPage: ExitIntentPage;
  fileDownloadPage: FileDownloadPage;
  fileUploadPage: FileUploadPage;
  floatingMenuPage: FloatingMenuPage;
  forgotPasswordPage: ForgotPasswordPage;
  framesPage: FramesPage;
  iframePage: IFramePage;
  geolocationPage: GeolocationPage;
  homePage: HomePage;
  horizontalSliderPage: HorizontalSliderPage;
  hoversPage: HoversPage;
  infiniteScrollPage: InfiniteScrollPage;
  inputsPage: InputsPage;
  jqueryUiMenuPage: JqueryUiMenuPage;
  jsAlertsPage: JsAlertsPage;
  jsErrorPage: JsErrorPage;
  keyPressesPage: KeyPressesPage;
  largeAndDeepDomPage: LargeAndDeepDomPage;
  loginPage: LoginPage;
  multipleWindowsPage: MultipleWindowsPage;
  nestedFramesPage: NestedFramesPage;
  notificationMessagePage: NotificationMessagePage;
  redirectorPage: RedirectorPage;
  secureFileDownloadPage: SecureFileDownloadPage;
  shadowDomPage: ShadowDomPage;
  shiftingContentPage: ShiftingContentPage;
  slowResourcesPage: SlowResourcesPage;
  sortableDataTablesPage: SortableDataTablesPage;
  statusCodesPage: StatusCodesPage;
  typosPage: TyposPage;
  wysiwygEditorPage: WysiwygEditorPage;
}

export const test = base.extend<PageFixtures>({
  abTestPage: async ({ page }, use) => use(new ABTestPage(page)),
  addRemoveElementsPage: async ({ page }, use) => use(new AddRemoveElementsPage(page)),
  basicAuthPage: async ({ page }, use) => use(new BasicAuthPage(page)),
  brokenImagesPage: async ({ page }, use) => use(new BrokenImagesPage(page)),
  challengingDomPage: async ({ page }, use) => use(new ChallengingDomPage(page)),
  checkboxesPage: async ({ page }, use) => use(new CheckboxesPage(page)),
  contextMenuPage: async ({ page }, use) => use(new ContextMenuPage(page)),
  digestAuthPage: async ({ page }, use) => use(new DigestAuthPage(page)),
  disappearingElementsPage: async ({ page }, use) => use(new DisappearingElementsPage(page)),
  dragAndDropPage: async ({ page }, use) => use(new DragAndDropPage(page)),
  dropdownPage: async ({ page }, use) => use(new DropdownPage(page)),
  dynamicContentPage: async ({ page }, use) => use(new DynamicContentPage(page)),
  dynamicControlsPage: async ({ page }, use) => use(new DynamicControlsPage(page)),
  dynamicLoadingPage: async ({ page }, use) => use(new DynamicLoadingPage(page)),
  entryAdPage: async ({ page }, use) => use(new EntryAdPage(page)),
  exitIntentPage: async ({ page }, use) => use(new ExitIntentPage(page)),
  fileDownloadPage: async ({ page }, use) => use(new FileDownloadPage(page)),
  fileUploadPage: async ({ page }, use) => use(new FileUploadPage(page)),
  floatingMenuPage: async ({ page }, use) => use(new FloatingMenuPage(page)),
  forgotPasswordPage: async ({ page }, use) => use(new ForgotPasswordPage(page)),
  framesPage: async ({ page }, use) => use(new FramesPage(page)),
  iframePage: async ({ page }, use) => use(new IFramePage(page)),
  geolocationPage: async ({ page }, use) => use(new GeolocationPage(page)),
  homePage: async ({ page }, use) => use(new HomePage(page)),
  horizontalSliderPage: async ({ page }, use) => use(new HorizontalSliderPage(page)),
  hoversPage: async ({ page }, use) => use(new HoversPage(page)),
  infiniteScrollPage: async ({ page }, use) => use(new InfiniteScrollPage(page)),
  inputsPage: async ({ page }, use) => use(new InputsPage(page)),
  jqueryUiMenuPage: async ({ page }, use) => use(new JqueryUiMenuPage(page)),
  jsAlertsPage: async ({ page }, use) => use(new JsAlertsPage(page)),
  jsErrorPage: async ({ page }, use) => use(new JsErrorPage(page)),
  keyPressesPage: async ({ page }, use) => use(new KeyPressesPage(page)),
  largeAndDeepDomPage: async ({ page }, use) => use(new LargeAndDeepDomPage(page)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  multipleWindowsPage: async ({ page }, use) => use(new MultipleWindowsPage(page)),
  nestedFramesPage: async ({ page }, use) => use(new NestedFramesPage(page)),
  notificationMessagePage: async ({ page }, use) => use(new NotificationMessagePage(page)),
  redirectorPage: async ({ page }, use) => use(new RedirectorPage(page)),
  secureFileDownloadPage: async ({ page }, use) => use(new SecureFileDownloadPage(page)),
  shadowDomPage: async ({ page }, use) => use(new ShadowDomPage(page)),
  shiftingContentPage: async ({ page }, use) => use(new ShiftingContentPage(page)),
  slowResourcesPage: async ({ page }, use) => use(new SlowResourcesPage(page)),
  sortableDataTablesPage: async ({ page }, use) => use(new SortableDataTablesPage(page)),
  statusCodesPage: async ({ page }, use) => use(new StatusCodesPage(page)),
  typosPage: async ({ page }, use) => use(new TyposPage(page)),
  wysiwygEditorPage: async ({ page }, use) => use(new WysiwygEditorPage(page)),
});

export { expect } from '@playwright/test';
