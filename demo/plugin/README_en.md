# How to design plugin?

<a href="./README.md">中文文档</a> | <a href="./README_en.md">English document</a>

## 1. Basic information

When creating a plug-in, you need to fill in the `name` and `description`, where the `description` needs to introduce the use of the plug-in in detail and slightly, so that it is easy to understand the large model. When you talk to the big model, the big model will decide whether to call the plug-in based on the description.

## 2. Parameter declaration

To declare the entry of the plug-in, you need to set the correct parameter type and parameter description. When the large model calls the plug-in, it extracts the values of these parameters from the user`s question and feeds them to the plug-in function.

## 3. Code specification

```ts
new Promise((resolve, reject) => {
// Get the input param from params
resolve(JSON.stringify(params))
})
```

The default `Promise` structure is not recommended to change.

The `params` parameter is the input object, and all declared parameters can be obtained in` params`, so do not override the `params` global variable.

Plugin execution results are returned by `resolve()`.

Some common dependencies can be used, such as` const fetch = require('node-fetch') `.

## 4. Plugin testing

In the plug-in test window, you can fill in custom parameter values to test the plug-in function.

## 5. Use plugin

In the assistant interface that supports plug-ins, the plug-in selection button will appear in the lower left corner of the question input box. After selecting the plug-in you need, you can have a dialogue. The specific plug-in invocation effect varies according to the large model.
