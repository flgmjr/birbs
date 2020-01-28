[![Build Status](https://travis-ci.org/flgmjr/birbs.svg?branch=master)](https://travis-ci.org/flgmjr/birbs)

# Birbs 

Capture and admire all your joyful events with this event manager!

-------
## What is Birbs?
Birbs is a tool to help you deal with events in a semantic declarative fashion. With it, it is possible to decouple your application without losing track of the whole process as a business perspective, while also keeping the code organized.

## Ok, But Why Birbs?
Whenever programming or designing any application, we need to setup communication and data transferring between multiple parts of it. The problem comes when a system meets the barrier all systems face at some point: The manageability of complex Interfaces, the increasing number of classes and how to maintain them decoupled. As long as that codebase keeps enlarging, we know it gets harder to keep it [SOLID](https://en.wikipedia.org/wiki/SOLID).

Although Node's plain events can be more than enough to get that desired decoupling, it could also do better! Birbs provides the funcionality of Node's events with a sweet sweet interface that requires almost no extra work to be done!

## And How Does That Work? 
Birbs gives context and extensibility to Node's events.

This library proposes that an Event and the effect it has in your application should be self contained. This means that your Event represents the modification to the context and to the state of your application.

For instance, let's say we have a Supermarket Application. We would need a `MeatDepartment` domain and a `FruitDepartment` domain; They would be Contexts of our application. For these both, we need a function or method called `weightProduct()`. With Birbs we can have a `Procedure` for this task, and execute it in any of the contexts.

The Procedure of wheighting the products makes a modification to the context they're in. For example, it could set a property of the context `measuredProductsWeight`, used when the checkout is wanted

## How to install?
```
npm i birbs --save
```

-----
## Pratical Examples:
### [**Messaging Application:** *Notifications [Js]*](https://github.com/flgmjr/birbs/tree/master/pratical-examples/messaging-js)

Let's say here we got to do a chat Application. We would like to have the features of different Rooms and message notifications!

For the sake of simplicity, we will not create all the servers and routes, just execute it in Node directly. Take a look on the linked folder above or [here](https://github.com/flgmjr/birbs/tree/master/pratical-examples/messaging-js).

----
# API Reference:
Before we get started, let's get to know our entities. There's `Context`, `Procedure`, `Pipeline`, and `EventManager`.

> When saying `Birbable`, it means either a Procedure or a Pipeline.

If your IDE or editor shows you properties or methods which are not documented, it means that they are private, nd you should not use them directly.

## Context : **_class_**
A Context defines a group of information available to a Procedure or Pipeline when it gets executed. It may have any Bibrbable instance signed on it.

The constructor takes a string as an Identifier, used to map the context in a `Manager`.

### Context.identifier  ~~---~~  **_readonly property : string | symbol_**
Identifier of the context.

### Context.trigger()  ~~---~~  **_method : this_**
Triggers the execution of a signed `Birbable`. Accepts as an argument a signed birbable name and optionally, extra information to be passed to the birbable to be triggered.
```javascript
context.trigger('Birbable Name', extraInfo);
```

### Context.sign()  ~~---~~  **_method : this_**
Signs a Birbable in this context. Accepts a Birbable as an argument.
```javascript
context.sign(BirbableEntity);
```

### Context.unsign()  ~~---~~  **_method : this_**
Removes a Birbable from this context. Accepts a Birbable as an argument.
```javascript
context.unsign(BirbableEntity);
```

## Procedure : **_abstract class_** - Birbable
Is the unit that contains the instructions to change data or a state of the application. Must be executed in a context through the `.trigger()` method.

This class is supposed to be extended so you can add your own implementation of the `.execute()` method.

### Procedure.__type  ~~---~~  **_readonly property : "PROCEDURE"_**
Type of birbable. Used internally to do assertions.

### Procedure.lifetime  ~~---~~  **_readonly property : string_**
Lifetime of the Birbable, can be either `"DURABLE"` OR `"SINGLE"`. `"DURABLE"` means the Birbable will be able to be used on a context until it gets manually removed with `.unisgn()`; `"SINGLE"` lifetime birbables can only be executed once per `sign()`.

### Procedure.group  ~~---~~  **_readonly property : symbol_**
Procedures and Pipelines can have this property set at the constructor. If a Birbable with this property set is triggered, all of the other belonging with the same group get removed as well.

### Procedure.belongsToGroup  ~~---~~  **_readonly property : boolean_**
Wether this Birbable belongs to a group or not.

### Procedure.execute()  ~~---~~  **_abstract async method : Promise(void)_**
Is the method that contains the change to be made when the Birbable gets triggered.

Context is the context in which the procedure was triggered, while the descriptable is an optional argument containing extra data to be used in that execution.

**Attention!** - This method requires to be declared and implemented by you.

```javascript
Procedure.execute(context, descriptable?);
```

## Pipeline : **_abstract class_** - Birbable
Contains a sequential set of instructions. Must be executed in a context through the `.trigger()` method.

This class is supposed to be extended, but you **MUST NOT** override its `execute()` method.

The constructor accepts as arguments:
 - options: The options of the Birbable
 - onFinish: Callback executed when the pipeline finishes, which receives as argument the context.
 - onFail: If any of the procedures promises get rejected, this function will be called, or an error will be thrown

```javascript
new Pipeline(option, onFinish?, onFail?);
```

### Pipeline.__type  ~~---~~  **_readonly property : "PIPELINE"_**
Type of birbable. Used internally to do assertions.

### Pipeline.lifetime  ~~---~~  **_readonly property : string_**
Lifetime of the Birbable, can be either `"DURABLE"` OR `"SINGLE"`. `"DURABLE"` means the Birbable will be able to be used on a context until it gets manually removed with `.unisgn()`; `"SINGLE"` lifetime birbables can only be executed once per `sign()`.

### Pipeline.group  ~~---~~  **_readonly property : symbol_**
Pipelines and Pipelines can have this property set at the constructor. If a Birbable with this property set is triggered, all of the other belonging with the same group get removed as well.

### Pipeline.belongsToGroup  ~~---~~  **_readonly property : boolean_**
Wether this Birbable belongs to a group or not.

### Pipeline.addStep  ~~---~~  **_method : this_**
Adds a Birbable to be executed in the pipeline. They are executed in the order they were added.

```javascript
Pipeline.addStep(BirbableEntity);
```

### Pipeline.execute()  ~~---~~  **_async method : Promise(void)_**
It is the method that triggers the pipeline.

Context is the context in which the Pipeline was triggered, while the descriptable is an optional argument containing extra data to be used in that execution.

```javascript
Pipeline.execute(context, descriptable?);
```

## EventManager : **_class_**
It is the entity that you can use to trigger a Procedure in a Context. It is also possible to use it as a context group.

This special entity should be used whenever possible to broadcast birbables since it enables to trigger them without a reference.

### EventManager.addContext()
Adds a context to an EventManager. Returns the EventManager

```javascript
  EventManager.addContext(context: Context);
```

### EventManager.removeContext()
Removes a context from an EventManager. Returns the EventManager

```javascript
  EventManager.removeContext(context: string);
```

### EventManager.broadcast()
Triggers a Procedure execution. Returns the EventManager

The context argument is optional. If ommited, the manager will try triggering the Procedure in all of its Contexts

```javascript
  EventManager.broadcast(
    birbable : string,
    context ?: string,
    descriptable ?: any
  );
```
### EventManager.addBirbable()
Adds a Birbable to a Context. Returns the EventManager

```javascript
  EventManager.addBirbable(
    birbable : Birbable,
    context : Context | symbol
  );
```

### EventManager.removeProcedure()
Removes a Birbable from a Context. Returns the EventManager

```javascript
  EventManager.removeProcedure(
    birbable : string,
    context : Context | symbol
  );
```
