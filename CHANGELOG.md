# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]


## [1.0.2] - 2026-09-15

### Changed
- Add new value "_AW-meter_" to _Humidity Device_ nomenclatture.
- Display "_Aw_" humidity unit to "_Precise humidity measurement_" field
- Add new value "_Other_" to _Subsrate Test_ nomenclature.
- Make optional the "_Substrate Test_" field for viability tests but keep it required for germination tests.
- In storage action make observer optional.

## [1.0.1] - 2026-09-10

### Added
- Added suggestions for VS Code extensions and default settings for the Ruff extension.

### Fixed
- Correction of the sowing migration downgrade by adding the removal of rows where id_actor or id_storage is null.

### Changed
- Replace Black by Ruff and add rules in `pyproject.toml`.
- Apply code formating and import sorting to all backend files with Ruff.

## [1.0.0] - 2026-09-10

### Added

- Initial release including harvests, harvested material, seed, sowing, storage, germination tests, viability tests and cultural tracking.[@BassirouD, @Aïcha EL JILI, @HANAFI77, @jpm-cbna, @ch-cbna]
- Added link betwen cultural tracking and havested material. [@HANAFI77]

## [0.4.0] - 2026-09-04

### Added
- Design and ergonomics improvements. [@HANAFI77]
- Global reviewing and refactoring code. [@HANAFI77]
- Adding business rules to the module's forms. [@HANAFI77]
- Added cultural tracking section. [@HANAFI77]
- Finalize sowing section. [@HANAFI77]
- Redesign and improvments of sowing section. [@HANAFI77]
- Redesign and improvments of germination tests section. [@HANAFI77]
- Redesign and improvments of viability tests section. [@HANAFI77]
- Redesign and improvments of seed details. [@HANAFI77]
- Redesign and improvments of storage section. [@HANAFI77]
- Redesign and improvments of harvest form and map. [@HANAFI77]
- Redesign and improvments of harvested material form. [@HANAFI77]

### Fixed
- Fixed several bugs on storgage, sowing, germination and viability tests. [@HANAFI77]
- Fixed nomenclature values deleting in Alembic migration. [@jpm-cbna]
- Fixed GeoNature install module with legacy `package-lock.json`. [@jpm-cbna]

## [0.3.0] - 2025-08-21

### Added
- Added first draft of sowing section. [@Aïcha EL JILI]
- Added germination tests section. [@Aïcha EL JILI]
- Added viability tests section. [@Aïcha EL JILI]

## [0.2.0] - 2025-05-13

### Added
- Added seed details with TaxHub integration. [@BassirouD]
- Added storage section. [@BassirouD]

## [0.1.0] - 2025-03-31

### Added
- Added harvests list with filter and map. [@BassirouD]
- Added harvests export in CSV. [@BassirouD]
- Added harvest form and map. [@BassirouD]
- Added harvested material form. [@BassirouD]
