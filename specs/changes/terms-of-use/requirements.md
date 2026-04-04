# Requirements

## Overview
This feature introduces a dedicated "Terms of Use" page and integrates its acceptance into the user registration flow. It ensures users can review the platform rules (including standard header and footer) and explicitly mandates their consent before account creation, fulfilling standard legal and compliance expectations.

## Requirements

### REQ-1: Terms of Use Page

**User Story:** As a prospective user, I want to view the terms of use, so that I understand my rights and responsibilities.

#### Acceptance Criteria
1.1 WHERE a user navigates to the terms of use route, the application SHALL display the terms of use content.
1.2 THE application SHALL display the global header on the terms of use page.
1.3 THE application SHALL display the global footer on the terms of use page.
1.4 WHEN the terms of use page loads, THEN the application SHALL set the document title to "Semeando Devs | Termos de Uso".

### REQ-2: Registration Checkbox

**User Story:** As a prospective user registering for an account, I want to explicitly accept the terms of use, so that my registration process complies with legal policies.

#### Acceptance Criteria
2.1 THE application SHALL display an unchecked terms of use consent checkbox on the registration form.
2.2 WHERE the consent checkbox is unchecked, the application SHALL prevent submission of the registration form.
2.3 THE application SHALL display a link to the terms of use page next to the consent checkbox.
2.4 WHEN the user clicks the terms of use link, THEN the application SHALL open the terms of use page in a new browser tab.
