testing aliases and combinatory paths to allow for a free form of navigation, while still allowing for a more structured naming convention.

the idea is basically to query the go/links api for a route that includes all elements of the path, but not necessarily in the same order, and allowing for abbreviations / aliases.

# examples

### aliases: 

- `go/docs/gg/fire` --> `go/documentation/google/firebase`
- `go/doc/goog/fb` --> `go/documentation/google/firebase`
- `go/d/g/fire/auth` --> `go/documentation/google/firebase/authentication`


### combinatory paths:

- `go/funny_cat_vids/youtube` === `go/youtube/funny_cat_vids`


- `go/docs/goog/fire/auth` === `go/goog/docs/fire/auth` === `go/auth/goog/fire/docs` === `go/auth/fire/docs/goog` ...


