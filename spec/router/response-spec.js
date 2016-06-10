const rewire = require("rewire")
const response = rewire("../../lib/router/response")

describe("router.response", () => {

  describe("register", () => {

    const orig_middlewares = response.middlewares.list()

    it("adds a middleware fn to the beginning of middleware list", () => {
      const fn = () => {}
      response.middlewares.register(fn)
      expect(response.middlewares.list().length).toBe(4)
      expect(response.middlewares.list()[0]).toBe(fn)
    })

    it("will replace the middleware list with a new one when called with an array", () => {
      // from last test
      expect(response.middlewares.list().length).toBe(4)

      response.middlewares.register(["blah"])
      expect(response.middlewares.list().length).toBe(1)

      // also resetting middlewares, important! for other tests
      response.middlewares.register(orig_middlewares)
      expect(response.middlewares.list().length).toBe(3)
    })

    it("throws an error if argument is not a function/array", () => {
      expect(() => {
        response.middlewares.register({})
      }).toThrowError(/register expects/)
    })

    it("mutating list() does not mutate the middlewares", () => {
      const l = response.middlewares.list()
      const orig_len = l.length
      l.push(123)
      expect(response.middlewares.list().length).toBe(orig_len)
      expect(l.length).toBe(orig_len + 1)
    })
  })

  describe("render", () => {
    it("calls middlewares passed in, in order until one of them returns a result", () => {
      const rmap = {
        blah: 1
      }

      const middlewares = [
        (req, res) => {
          expect(res).toEqual({
            blah: 1
          })
          res.called = 1
          // not returning goes to next middleware
        },
        (req, res) => {
          expect(res).toEqual({ blah: 1, called: 1})
          // have to render a valid response map
          return { status: 200, headers: {}, body: "hi!" }
        }
      ]

      const result = response.render({}, rmap, middlewares)
      expect(result).toEqual({
        status: 200,
        headers: {},
        body: "hi!"
      })
    })

    it("throws if invalid response from response middlewares or no middleware can handle the `resp`", () => {
      expect(() => {
        response.render({}, "blah", [])
        // errors since no middlewares returned a response
      }).toThrowError(/unable to render/)

      expect(() => {
        response.render({}, "blah", [
          () => {
            return { status: "abc", headers: {}, body: "blah" }
          }
        ])
        // errors since the middle returned an invalid map
      }).toThrowError(/unable to render/)
    })
  })

  describe("response", () => {
    const render = response.__get__("render")
    const mock_core = require("../../lib/core/core")
    response.__set__("core", mock_core)

    afterEach(() => {
      response.__set__("render", render)
    })

    it("calls render then core.send", () => {
      let called = ""
      response.__set__("render", (req, rmap, middlewares) => {
        expect(req).toBe("req")
        expect(rmap).toEqual({ status: 200, headers: {}, body: "body" })
        expect(Array.isArray(middlewares)).toBe(true)
        called = called + "a"
      })

      mock_core.send = () => {
        called = called + "b"
      }

      response.response("req", "res", "body")
      expect(called).toBe("ab")
    })
  })

  describe("render_string", () => {
    it("")
  })

  describe("render_number", () => {
    it("")
  })

  describe("render_file", () => {
    it("")
  })

})