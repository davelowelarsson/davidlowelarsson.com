---
title: "Maya Scene, Python to XML"
description: "Writing a Python import/export pipeline so artists could move Maya scenes into a proprietary XML-based engine without needing the engine running."
pubDate: 2013-02-14
liveFrom: 2026-07-21
category: experiment
draft: false
tags: ["archive", "3d", "python", "tooling", "maya", "xml-export-import"]
---

![Python to XML exporter tool screenshot](./feature.png)

## Python to XML

I've been working on this script to improve the workflow at work. The 3D engine that we use is an inhouse developed engine that reads XML for all of it's objects, materials and more.

So I sat out to just export the XML directly from Maya. In the beginning I felt that the difficulty level was rather high, but keep in mind that I'm no programmer even though I do have some experience in writing code.

Before this tool there was no real way to see if everything was done correctly without starting the engine. The engine mainly works on Linux and it's not as straight forward to start it as for example Unity or UDK. So for any non "techie artist" the ability to control their work was non existent.

The initial request was for an exporter only, but my experience told me that it would set the artists in a similar position we had experienced before, not being able to control their work. But if they also could import the XML similar to how the engine reads it then they could see how the scene would be presented inside the engine.

I started with a simple "dump object" that just prints the current selection of objects to the Maya script editor in XML format.

```xml
<object name="pCube1" type="dummy">
	<!-- <parent>world</parent> -->
	<position>-6.1381947679912869, 4.7982414604036592, 5.3585726278059624</position>
	<lookAt>-5.3813572380546155, 5.4335790457966446, 5.2051349992190694</lookAt>
	<up>-6.7750359604408494, 5.5678860052331087, 5.4041858957626614</up>
	<uScale>2.9399999999999995</uScale>
</object>
```

I then continued with the more difficult Export/Import track script. This entails converting euler rotation to a look at and up positions because that's what the engine uses (don't ask me why that design choice was made, it's a real pain). Maya has no easy way of converting that so the technique I used was to create objects for up and aim (locators) and then moving them into place and then finally query them about position for the result. The creation of this script was really fun. Exporting the XML was pretty easy, although getting it back in was not as straight forward.

Importing the XML was difficult mainly because of the look at and up locations instead of rotations. I needed to create temporary locators and then use a aimConstraint and then finally start getting the right rotations. After creating all those things i needed to clean the scene up again and let the user continue working without any clutter in the scene

[Watch the video](https://www.youtube.com/watch?v=UXsNGHSSLPo)

The next step was importing exporting a whole scene. Although there was a lot of lines of code involved it was pretty straight forward. Just collecting different values and then printing them in XML format in a file. I can't think of any hurdles except the ability to distinguish groups easily in Maya. This seems like an old problem, I searched the internet and didn't find any easy solutions. Just like the type 'mesh' there should be a type 'group', it's weird in my opinion. I understand that groups need to behave like transforms but there should really be an easy way to find groups in a Maya scene. I might have missed something (please comment if I have)

When importing a module it converts all the position data, obj and materials into a Maya friendly version again. If you are importing a file into a Maya scene that already has materials that are associated with an object it just applies it (that way you could use a more complex material inside Maya). If the material isn't present it creates the material instead. That way you will always have an "identical" scene in the engine and in Maya.

[Watch the video](https://www.youtube.com/watch?v=PKhWh5Hbx6U)

Creating support for different materials is what I would consider the biggest challenge; there are so many different scenarios with materials and it can be a challenge to handle all the different options.

The importance of this is also the ability to "lift" any module, make changes and just export it again. Without the need to have the "source" Maya scene. This is extremely powerful in a distributed work environment. You also don't need to have any knowledge about how the Maya scene was created or have access to the internal LAN (if you're using a inhouse system). Another advantage is that the scene becomes version independent (ever tried opening a Maya 2013 scene in Maya 2012?).

Although the importer/exporter has it's limitations. In time they would probably be worked out. All these things are only minor hurdles and would be "ironed out" eventually.
