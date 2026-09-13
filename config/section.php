<?php

/*
|--------------------------------------------------------------------------
| Sections
|--------------------------------------------------------------------------
|
| Every section of the office that has its own dashboard, keyed by the
| section_name stored in the sections table (uppercase).
|
| This drives three things at once:
|
|   1. routes/web.php registers one guarded dashboard route per entry.
|   2. DashboardResolver sends an employee here after login. A section
|      with no entry cannot log in at all.
|   3. The sidebar in resources/js/config/navigation.js links to the
|      route named below.
|
| Adding a section means adding an entry here, a page component at the
| named path, a navigation.js entry, and a row in the sections table
| (see database/seeders/SectionSeeder.php).
|
*/

return [

    'RDO' => [
        'path' => '/rdo/dashboard',
        'route' => 'rdo.dashboard',
        'page' => 'RDO/Dashboard',
    ],

    'ASSESSMENT' => [
        'path' => '/assessment/dashboard',
        'route' => 'assessment.dashboard',
        'page' => 'Assessment/Dashboard',
    ],

    /*
    * Client Support Section.
    */
    'CSS' => [
        'path' => '/css/dashboard',
        'route' => 'css.dashboard',
        'page' => 'CSS/Dashboard',
    ],

    'COLLECTION' => [
        'path' => '/collection/dashboard',
        'route' => 'collection.dashboard',
        'page' => 'Collection/Dashboard',
    ],

    'COMPLIANCE' => [
        'path' => '/compliance/dashboard',
        'route' => 'compliance.dashboard',
        'page' => 'Compliance/Dashboard',
    ],

];
