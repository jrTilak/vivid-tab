const Page = () => {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: `<div style="width:100%;height:500px;" data-fillout-id="9TVHXMBuvkus" data-fillout-embed-type="standard" data-fillout-inherit-parameters data-fillout-dynamic-resize></div><script src="https://server.fillout.com/embed/v1/"></script>`,
      }}
    />
  );
};

export default Page;
